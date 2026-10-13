from django.core.cache import cache
from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.repairs.models import RepairRequest

PW = "Str0ng-pass-123"
URL = "/api/v1/repairs/"


def client_for(user=None):
    c = APIClient()
    if user:
        c.force_authenticate(user)
    return c


class RepairApiTests(TestCase):
    def setUp(self):
        cache.clear()
        self.customer = User.objects.create_user("c@example.com", PW)
        self.other = User.objects.create_user("o@example.com", PW)
        self.master = User.objects.create_user("m@example.com", PW, role="master")
        self.stranger = User.objects.create_user("m2@example.com", PW, role="master")

    def create(self):
        return client_for(self.customer).post(
            URL,
            {"device": "iPhone 13", "issue": "Не включается", "phone": "+996700123456"},
            format="json",
        )

    def test_create_requires_auth(self):
        r = client_for().post(URL, {"device": "x", "issue": "y", "phone": "+996700123456"}, format="json")
        self.assertIn(r.status_code, (401, 403))

    def test_create_ok_and_logged(self):
        r = self.create()
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["status"], "submitted")
        self.assertEqual(len(r.data["events"]), 1)

    def test_invalid_phone_rejected(self):
        r = client_for(self.customer).post(
            URL, {"device": "x", "issue": "y", "phone": "abc"}, format="json"
        )
        self.assertEqual(r.status_code, 400)

    def test_other_user_gets_404(self):
        rid = self.create().data["id"]
        self.assertEqual(client_for(self.other).get(f"{URL}{rid}/").status_code, 404)

    def test_customer_cannot_jump_to_in_progress(self):
        rid = self.create().data["id"]
        r = client_for(self.customer).post(f"{URL}{rid}/status/", {"status": "in_progress"}, format="json")
        self.assertEqual(r.status_code, 400)

    def test_unassigned_master_gets_404(self):
        rid = self.create().data["id"]
        RepairRequest.objects.filter(pk=rid).update(master=self.master)
        self.assertEqual(client_for(self.stranger).get(f"{URL}{rid}/").status_code, 404)

    def test_quote_only_in_diagnostics(self):
        rid = self.create().data["id"]
        RepairRequest.objects.filter(pk=rid).update(master=self.master)
        r = client_for(self.master).post(f"{URL}{rid}/quote/", {"amount": "1000"}, format="json")
        self.assertEqual(r.status_code, 400)

    def test_customer_cannot_send_quote(self):
        rid = self.create().data["id"]
        RepairRequest.objects.filter(pk=rid).update(status="diagnostics")
        r = client_for(self.customer).post(f"{URL}{rid}/quote/", {"amount": "1000"}, format="json")
        self.assertEqual(r.status_code, 403)

    def test_full_flow(self):
        rid = self.create().data["id"]
        RepairRequest.objects.filter(pk=rid).update(master=self.master)
        m, c = client_for(self.master), client_for(self.customer)

        def move(cl, status):
            return cl.post(f"{URL}{rid}/status/", {"status": status}, format="json")

        self.assertEqual(move(m, "accepted").status_code, 200)
        self.assertEqual(move(m, "diagnostics").status_code, 200)
        q = m.post(f"{URL}{rid}/quote/", {"amount": "1500.00", "note": "Замена экрана"}, format="json")
        self.assertEqual(q.status_code, 200)
        self.assertEqual(q.data["status"], "awaiting_approval")
        self.assertEqual(move(m, "approved").status_code, 400)  # мастер не может согласовать за клиента
        self.assertEqual(move(c, "approved").status_code, 200)
        for s in ("in_progress", "ready", "delivered"):
            self.assertEqual(move(m, s).status_code, 200)
        final = c.get(f"{URL}{rid}/")
        self.assertEqual(final.data["status"], "delivered")
        self.assertEqual(len(final.data["events"]), 8)

    def test_master_list_only_assigned(self):
        rid = self.create().data["id"]
        RepairRequest.objects.filter(pk=rid).update(master=self.master)
        self.assertEqual(len(client_for(self.master).get(f"{URL}master/").data), 1)
        self.assertEqual(len(client_for(self.stranger).get(f"{URL}master/").data), 0)
        self.assertEqual(client_for(self.customer).get(f"{URL}master/").status_code, 403)