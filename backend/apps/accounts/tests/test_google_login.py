from unittest.mock import patch

from django.core.cache import cache
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from apps.accounts import google_auth
from apps.accounts.models import SocialIdentity, User

URL = "/api/v1/auth/google/"
PW = "Str0ng-pass-123"


def claims(**extra):
    return {"sub": "g-123", "email": "a@example.com", "email_verified": True,
            "given_name": "Amin", **extra}


@override_settings(GOOGLE_CLIENT_ID="test-client")
class GoogleLoginTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()

    def login(self, data=None):
        with patch("apps.accounts.google_auth.verify_google_credential", return_value=data or claims()):
            return self.client.post(URL, {"credential": "token"}, format="json")

    def test_new_user_is_created_and_logged_in(self):
        self.assertEqual(self.login().status_code, 200)
        user = User.objects.get(email="a@example.com")
        self.assertTrue(user.email_verified)
        self.assertFalse(user.has_usable_password())
        self.assertEqual(user.first_name, "Amin")
        self.assertEqual(SocialIdentity.objects.count(), 1)
        self.assertEqual(self.client.get("/api/v1/auth/me/").status_code, 200)

    def test_repeat_login_reuses_account(self):
        self.login()
        self.login()
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(SocialIdentity.objects.count(), 1)

    def test_links_verified_password_account_and_keeps_password(self):
        user = User.objects.create_user("a@example.com", PW, email_verified=True)
        self.assertEqual(self.login().status_code, 200)
        self.assertEqual(User.objects.count(), 1)
        user.refresh_from_db()
        self.assertTrue(user.check_password(PW))
        self.assertEqual(SocialIdentity.objects.get().user_id, user.pk)

    def test_unverified_password_account_loses_old_password(self):
        user = User.objects.create_user("a@example.com", PW)
        self.assertEqual(self.login().status_code, 200)
        user.refresh_from_db()
        self.assertFalse(user.check_password(PW))
        self.assertTrue(user.email_verified)

    def test_unverified_google_email_rejected(self):
        self.assertEqual(self.login(claims(email_verified=False)).status_code, 400)
        self.assertEqual(User.objects.count(), 0)

    def test_invalid_credential_rejected(self):
        with patch(
            "apps.accounts.google_auth.verify_google_credential",
            side_effect=google_auth.GoogleAuthError("bad"),
        ):
            r = self.client.post(URL, {"credential": "token"}, format="json")
        self.assertEqual(r.status_code, 400)
        self.assertEqual(User.objects.count(), 0)

    def test_not_configured(self):
        with override_settings(GOOGLE_CLIENT_ID=""):
            r = self.client.post(URL, {"credential": "token"}, format="json")
        self.assertEqual(r.status_code, 503)

    def test_missing_or_huge_credential(self):
        self.assertEqual(self.client.post(URL, {}, format="json").status_code, 400)
        r = self.client.post(URL, {"credential": "x" * 5000}, format="json")
        self.assertEqual(r.status_code, 400)

    def test_inactive_user_rejected(self):
        User.objects.create_user("a@example.com", PW, is_active=False)
        self.assertEqual(self.login().status_code, 400)
        self.assertIn(self.client.get("/api/v1/auth/me/").status_code, (401, 403))

    def test_login_matches_by_sub_not_email(self):
        self.login()
        r = self.login(claims(email="new@example.com"))
        self.assertEqual(r.status_code, 200)
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(self.client.get("/api/v1/auth/me/").data["email"], "a@example.com")