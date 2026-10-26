from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core import signing
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode

from .models import User

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