from django.core import mail
from django.core.cache import cache
from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts import services
from apps.accounts.models import User

PASSWORD = "Str0ng-pass-123"


class AuthApiTests(TestCase):
    def setUp(self):
        cache.clear()  # сбрасываем счётчики throttling
        self.client = APIClient()

    def register(self, **extra):
        data = {"email": "a@example.com", "password": PASSWORD, **extra}
        return self.client.post("/api/v1/auth/register/", data, format="json")

    def test_register_logs_in_and_sends_email(self):
        self.assertEqual(self.register().status_code, 201)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(self.client.get("/api/v1/auth/me/").status_code, 200)

    def test_role_cannot_be_set_on_register(self):
        self.register(role="admin")
        self.assertEqual(User.objects.get().role, "customer")

    def test_role_cannot_be_changed_via_me(self):
        self.register()
        self.client.patch("/api/v1/auth/me/", {"role": "admin", "email_verified": True}, format="json")
        user = User.objects.get()
        self.assertEqual(user.role, "customer")
        self.assertFalse(user.email_verified)

    def test_weak_password_rejected(self):
        r = self.client.post(
            "/api/v1/auth/register/", {"email": "b@example.com", "password": "123"}, format="json"
        )
        self.assertEqual(r.status_code, 400)

    def test_duplicate_email_rejected(self):
        self.register()
        self.client.logout()
        self.assertEqual(self.register().status_code, 400)

    def test_login_wrong_password_is_generic(self):
        self.register()
        self.client.logout()
        r = self.client.post(
            "/api/v1/auth/login/", {"email": "a@example.com", "password": "wrong"}, format="json"
        )
        self.assertEqual(r.status_code, 400)
        self.assertEqual(r.data["detail"], "Неверный email или пароль.")

    def test_login_ok(self):
        self.register()
        self.client.logout()
        r = self.client.post(
            "/api/v1/auth/login/", {"email": "A@Example.com", "password": PASSWORD}, format="json"
        )
        self.assertEqual(r.status_code, 200)

    def test_me_requires_login(self):
        self.assertIn(self.client.get("/api/v1/auth/me/").status_code, (401, 403))

    def test_verify_email(self):
        self.register()
        user = User.objects.get()
        r = self.client.post(
            "/api/v1/auth/verify-email/", {"token": services.make_token(user)}, format="json"
        )
        self.assertEqual(r.status_code, 200)
        user.refresh_from_db()
        self.assertTrue(user.email_verified)

    def test_bad_token_rejected(self):
        r = self.client.post("/api/v1/auth/verify-email/", {"token": "garbage"}, format="json")
        self.assertEqual(r.status_code, 400)