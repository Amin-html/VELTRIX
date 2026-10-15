from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import User

PW = "Str0ng-pass-123"
URL = "/api/v1/auth/addresses/"


def client_for(user=None):
    c = APIClient()
    if user:
        c.force_authenticate(user)
    return c


class AddressApiTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user("a@example.com", PW)
        self.other = User.objects.create_user("b@example.com", PW)

    def create(self, user=None, **extra):
        data = {"label": "Дом", "address": "Бишкек, ул. Ленина 1", **extra}
        return client_for(user or self.user).post(URL, data, format="json")

    def test_requires_auth(self):
        self.assertIn(client_for().get(URL).status_code, (401, 403))

    def test_create_and_list_only_own(self):
        self.assertEqual(self.create().status_code, 201)
        self.create(user=self.other, label="Работа")
        r = client_for(self.user).get(URL)
        self.assertEqual(len(r.data), 1)
        self.assertEqual(r.data[0]["label"], "Дом")

    def test_other_user_cannot_touch(self):
        aid = self.create().data["id"]
        c = client_for(self.other)
        self.assertEqual(c.get(f"{URL}{aid}/").status_code, 404)
        self.assertEqual(c.patch(f"{URL}{aid}/", {"label": "X"}, format="json").status_code, 404)
        self.assertEqual(c.delete(f"{URL}{aid}/").status_code, 404)

    def test_update_and_delete_own(self):
        aid = self.create().data["id"]
        c = client_for(self.user)
        self.assertEqual(c.patch(f"{URL}{aid}/", {"label": "Офис"}, format="json").data["label"], "Офис")
        self.assertEqual(c.delete(f"{URL}{aid}/").status_code, 204)
        self.assertEqual(c.get(URL).data, [])

    def test_limit_ten(self):
        for _ in range(10):
            self.assertEqual(self.create().status_code, 201)
        self.assertEqual(self.create().status_code, 400)