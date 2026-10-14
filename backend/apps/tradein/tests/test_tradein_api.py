from decimal import Decimal

from django.core.cache import cache
from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.tradein.models import TradeInRequest

PW = "Str0ng-pass-123"
URL = "/api/v1/trade-ins/"


def client_for(user=None):
    c = APIClient()
    if user:
        c.force_authenticate(user)
    return c


class TradeInApiTests(TestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user("c@example.com", PW)
        self.other = User.objects.create_user("o@example.com", PW)

    def create(self, **extra):
        data = {
            "device": "iPhone 12", "condition": "good",
            "description": "Царапины на корпусе", "phone": "+996700123456", **extra,
        }
        return client_for(self.user).post(URL, data, format="json")

    def respond(self, rid, status, user=None):
        return client_for(user or self.user).post(
            f"{URL}{rid}/respond/", {"status": status}, format="json"
        )

    def test_create_requires_auth(self):
        r = client_for().post(URL, {"device": "x", "condition": "good", "phone": "+996700123456"}, format="json")
        self.assertIn(r.status_code, (401, 403))

    def test_create_ok(self):
        r = self.create()
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["status"], "submitted")
        self.assertIsNone(r.data["offer_amount"])

    def test_invalid_phone_rejected(self):
        self.assertEqual(self.create(phone="abc").status_code, 400)

    def test_invalid_condition_rejected(self):
        self.assertEqual(self.create(condition="perfect").status_code, 400)

    def test_other_user_gets_404(self):
        rid = self.create().data["id"]
        self.assertEqual(client_for(self.other).get(f"{URL}{rid}/").status_code, 404)
        self.assertEqual(self.respond(rid, "cancelled", user=self.other).status_code, 404)

    def test_cannot_accept_before_offer(self):
        rid = self.create().data["id"]
        self.assertEqual(self.respond(rid, "accepted").status_code, 400)

    def test_accept_offer_flow(self):
        rid = self.create().data["id"]
        TradeInRequest.objects.filter(pk=rid).update(status="offered", offer_amount=Decimal("20000"))
        r = self.respond(rid, "accepted")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["status"], "accepted")
        self.assertEqual(self.respond(rid, "cancelled").status_code, 400)

    def test_cannot_respond_to_finished(self):
        rid = self.create().data["id"]
        TradeInRequest.objects.filter(pk=rid).update(status="completed")
        self.assertEqual(self.respond(rid, "cancelled").status_code, 400)

    def test_cancel_submitted(self):
        rid = self.create().data["id"]
        r = self.respond(rid, "cancelled")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["status"], "cancelled")