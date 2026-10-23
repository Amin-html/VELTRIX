from django.conf import settings
from django.core import signing
from django.core.mail import send_mail
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
import re

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from .models import Address, User

from .models import User

USERNAME_RE = re.compile(r"^[a-z0-9_]{3,30}$")
RESERVED_USERNAMES = {"admin", "administrator", "support", "veltrix", "master", "api", "www", "root", "me", "help"}

SALT = "veltrix-email-verify"
MAX_AGE = 60 * 60 * 24 * 3  # 3 дня


def make_token(user) -> str:
    return signing.dumps({"uid": str(user.pk)}, salt=SALT)


def read_token(token: str) -> dict:
    return signing.loads(token, salt=SALT, max_age=MAX_AGE)


def send_verification_email(user) -> None:
    link = f"{settings.FRONTEND_URL}/auth/verify?token={make_token(user)}"
    send_mail(
        "Подтвердите email — VELTRIX",
        f"Чтобы подтвердить email, перейдите по ссылке (действует 3 дня):\n{link}",
        None,
        [user.email],
    )

def send_password_reset_email(user) -> None:
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    link = f"{settings.FRONTEND_URL}/auth/reset?uid={uid}&token={token}"
    send_mail(
        "Сброс пароля — VELTRIX",
        "Чтобы задать новый пароль, перейдите по ссылке (действует 1 час):\n"
        f"{link}\n\nЕсли вы не запрашивали сброс, просто проигнорируйте это письмо.",
        None,
        [user.email],
    )


def get_user_for_reset(uid: str, token: str):
    try:
        user = User.objects.get(pk=force_str(urlsafe_base64_decode(uid)))
    except (TypeError, ValueError, OverflowError, User.DoesNotExist, DjangoValidationError):
        return None
    return user if default_token_generator.check_token(user, token) else None

USERNAME_RE = re.compile(r"^[a-z0-9_]{3,30}$")
RESERVED_USERNAMES = {"admin", "administrator", "support", "veltrix", "master", "api", "www", "root", "me", "help"}


class UserSerializer(serializers.ModelSerializer):
    username = serializers.CharField(max_length=30, required=False, allow_blank=True, allow_null=True)
    avatar_url = serializers.SerializerMethodField()
    cover_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "email", "first_name", "phone", "role", "email_verified",
            "username", "bio", "city", "avatar_url", "cover_url", "date_joined",
        ]
        read_only_fields = ["id", "email", "role", "email_verified", "date_joined"]

    def get_avatar_url(self, obj):
        return obj.avatar.url if obj.avatar else None

    def get_cover_url(self, obj):
        return obj.cover.url if obj.cover else None

    def validate_username(self, value):
        if value is None or not value.strip():
            return None
        value = value.strip().lower()
        if not USERNAME_RE.match(value):
            raise serializers.ValidationError("От 3 до 30 символов: латинские буквы, цифры и _.")
        if value in RESERVED_USERNAMES:
            raise serializers.ValidationError("Это имя недоступно.")
        taken = User.objects.filter(username=value)
        if self.instance is not None:
            taken = taken.exclude(pk=self.instance.pk)
        if taken.exists():
            raise serializers.ValidationError("Это имя уже занято.")
        return value