from django.contrib.auth import authenticate, login, logout
from django.core import signing
from rest_framework import generics
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from .serializers import (
    LoginSerializer, PasswordResetConfirmSerializer, PasswordResetRequestSerializer,
    RegisterSerializer, UserSerializer, AddressSerializer
)
from . import services
from . import google_auth
from .models import User, Address
from rest_framework.exceptions import ValidationError
from django.conf import settings
from django.db import IntegrityError
from rest_framework.parsers import MultiPartParser

from . import images
from .stats import profile_stats

BACKEND = "django.contrib.auth.backends.ModelBackend"


class ThrottledView(APIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CsrfView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"detail": "ok"})


class RegisterView(ThrottledView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        if User.objects.filter(email=data["email"]).exists():
            return Response(
                {"detail": "Не удалось создать аккаунт. Если вы уже зарегистрированы, войдите."},
                status=400,
            )
        user = User.objects.create_user(
            email=data["email"],
            password=data["password"],
            first_name=data.get("first_name", ""),
        )
        services.send_verification_email(user)
        login(request, user, backend=BACKEND)
        return Response(UserSerializer(user).data, status=201)


class LoginView(ThrottledView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(
            request,
            username=serializer.validated_data["email"].lower(),
            password=serializer.validated_data["password"],
        )
        if user is None or not user.is_active:
            return Response({"detail": "Неверный email или пароль."}, status=400)
        login(request, user, backend=BACKEND)
        return Response(UserSerializer(user).data)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logout(request)
        return Response(status=204)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        try:
            serializer.save()
        except IntegrityError:
            return Response({"username": ["Это имя уже занято."]}, status=400)
        return Response(serializer.data)

class VerifyEmailView(ThrottledView):
    permission_classes = [AllowAny]

    def post(self, request):
        invalid = Response({"detail": "Ссылка недействительна или устарела."}, status=400)
        token = request.data.get("token")
        if not isinstance(token, str):
            return invalid
        try:
            payload = services.read_token(token)
        except signing.BadSignature:
            return invalid
        if not User.objects.filter(pk=payload["uid"]).update(email_verified=True):
            return invalid
        return Response({"detail": "ok"})


class ResendVerificationView(ThrottledView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not request.user.email_verified:
            services.send_verification_email(request.user)
        return Response({"detail": "ok"})

class PasswordResetRequestView(ThrottledView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].strip().lower()
        user = User.objects.filter(email=email, is_active=True).first()
        if user:
            services.send_password_reset_email(user)
        # ответ одинаков для существующих и несуществующих адресов
        return Response(
            {"detail": "Если аккаунт с таким email существует, мы отправили письмо со ссылкой."}
        )


class PasswordResetConfirmView(ThrottledView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        user = services.get_user_for_reset(data["uid"], data["token"])
        if user is None or not user.is_active:
            return Response({"detail": "Ссылка недействительна или устарела."}, status=400)
        try:
            validate_password(data["password"], user)
        except DjangoValidationError as exc:
            return Response({"password": list(exc.messages)}, status=400)
        user.set_password(data["password"])
        user.save(update_fields=["password"])
        return Response({"detail": "ok"})

MAX_ADDRESSES = 10


class AddressListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = AddressSerializer
    pagination_class = None

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        if self.get_queryset().count() >= MAX_ADDRESSES:
            raise ValidationError({"detail": f"Можно сохранить не больше {MAX_ADDRESSES} адресов."})
        serializer.save(user=self.request.user)


class AddressDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = AddressSerializer

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)
    
class GoogleLoginView(ThrottledView):
    permission_classes = [AllowAny]

    def post(self, request):
        if not settings.GOOGLE_CLIENT_ID:
            return Response({"detail": "Вход через Google не настроен."}, status=503)
        credential = request.data.get("credential")
        if not isinstance(credential, str) or not (0 < len(credential) <= 4096):
            return Response({"detail": "Не удалось войти через Google."}, status=400)
        try:
            info = google_auth.verify_google_credential(credential)
            user = google_auth.get_or_create_google_user(info)
        except google_auth.GoogleAuthError:
            return Response({"detail": "Не удалось войти через Google."}, status=400)
        login(request, user, backend=BACKEND)
        return Response(UserSerializer(user).data)


class ImageUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "upload"
    field = ""

    def process(self, upload):
        raise NotImplementedError

    def post(self, request):
        content = self.process(request.FILES.get("image"))
        user = request.user
        current = getattr(user, self.field)
        old_name, storage = current.name, current.storage
        current.save(content.name, content, save=False)
        user.save(update_fields=[self.field])
        if old_name:
            storage.delete(old_name)
        return Response(UserSerializer(user).data)

    def delete(self, request):
        user = request.user
        current = getattr(user, self.field)
        if current:
            name, storage = current.name, current.storage
            setattr(user, self.field, None)
            user.save(update_fields=[self.field])
            storage.delete(name)
        return Response(UserSerializer(user).data)


class AvatarView(ImageUploadView):
    field = "avatar"

    def process(self, upload):
        return images.process_avatar(upload)


class CoverView(ImageUploadView):
    field = "cover"

    def process(self, upload):
        return images.process_cover(upload)


class ProfileStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(profile_stats(request.user))