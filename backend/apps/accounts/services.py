from django.conf import settings
from django.core import signing
from django.core.mail import send_mail

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