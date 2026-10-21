from django.conf import settings
from django.db import IntegrityError, transaction

from .models import SocialIdentity, User


class GoogleAuthError(Exception):
    """Любая причина, по которой вход через Google не удался (клиенту детали не показываем)."""


def verify_google_credential(credential: str) -> dict:
    client_id = settings.GOOGLE_CLIENT_ID
    if not client_id:
        raise GoogleAuthError("not configured")

    from google.auth import exceptions as google_exceptions
    from google.auth.transport import requests as google_requests
    from google.oauth2 import id_token

    try:
        info = id_token.verify_oauth2_token(
            credential, google_requests.Request(), client_id, clock_skew_in_seconds=10
        )
    except (ValueError, google_exceptions.GoogleAuthError) as exc:
        raise GoogleAuthError(str(exc)) from exc
    if info.get("iss") not in ("accounts.google.com", "https://accounts.google.com"):
        raise GoogleAuthError("bad issuer")
    return info


def get_or_create_google_user(info: dict) -> User:
    if info.get("email_verified") is not True:
        raise GoogleAuthError("email not verified")
    sub = str(info.get("sub") or "")
    email = str(info.get("email") or "").strip().lower()
    if not sub or not email:
        raise GoogleAuthError("missing claims")

    identity = SocialIdentity.objects.select_related("user").filter(provider="google", uid=sub).first()
    if identity:
        user = identity.user
    else:
        try:
            with transaction.atomic():
                user = User.objects.filter(email=email).first()
                if user is None:
                    user = User.objects.create_user(
                        email=email,
                        password=None,
                        first_name=str(info.get("given_name") or "")[:80],
                        email_verified=True,
                    )
                elif not user.email_verified:
                    # защита от предварительного захвата: старый пароль больше не действует
                    user.set_unusable_password()
                    user.email_verified = True
                    user.save(update_fields=["password", "email_verified"])
                SocialIdentity.objects.create(user=user, provider="google", uid=sub)
        except IntegrityError:
            identity = SocialIdentity.objects.select_related("user").filter(
                provider="google", uid=sub
            ).first()
            if identity is None:
                raise GoogleAuthError("could not link account") from None
            user = identity.user

    if not user.is_active:
        raise GoogleAuthError("inactive user")
    return user