from django.contrib.auth import authenticate, login, logout
from django.core import signing
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from . import services
from .models import User
from .serializers import LoginSerializer, RegisterSerializer, UserSerializer

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
        serializer.save()
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