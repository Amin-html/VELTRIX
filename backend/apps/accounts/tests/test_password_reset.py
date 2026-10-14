import re

from django.core import mail
from django.core.cache import cache
from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import User

OLD = "Str0ng-pass-123"
NEW = "An0ther-str0ng-pass"


class PasswordResetTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.user = User.objects.create_user("a@example.com", OLD)

    def request_reset(self, email="a@example.com"):
        return self.client.post("/api/v1/auth/password-reset/", {"email": email}, format="json")

    def link_params(self):
        match = re.search(r"uid=([^&\s]+)&token=([^\s]+)", mail.outbox[-1].body)
        return match.group(1), match.group(2)

    def confirm(self, uid, token, password=NEW):
        return self.client.post(
            "/api/v1/auth/password-reset/confirm/",
            {"uid": uid, "token": token, "password": password},
            format="json",
        )

    def test_unknown_email_gets_same_response_and_no_mail(self):
        known = self.request_reset()
        unknown = self.request_reset("nobody@example.com")
        self.assertEqual(known.status_code, 200)
        self.assertEqual(unknown.status_code, 200)
        self.assertEqual(known.data, unknown.data)
        self.assertEqual(len(mail.outbox), 1)

    def test_reset_flow_changes_password(self):
        self.request_reset()
        uid, token = self.link_params()
        self.assertEqual(self.confirm(uid, token).status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(NEW))

    def test_token_is_single_use(self):
        self.request_reset()
        uid, token = self.link_params()
        self.confirm(uid, token)
        self.assertEqual(self.confirm(uid, token, "Third-str0ng-pass").status_code, 400)

    def test_weak_password_rejected_and_token_still_valid(self):
        self.request_reset()
        uid, token = self.link_params()
        self.assertEqual(self.confirm(uid, token, "123").status_code, 400)
        self.assertEqual(self.confirm(uid, token).status_code, 200)

    def test_garbage_token_rejected(self):
        self.assertEqual(self.confirm("abc", "xyz").status_code, 400)
        self.request_reset()
        uid, _ = self.link_params()
        self.assertEqual(self.confirm(uid, "bad-token").status_code, 400)