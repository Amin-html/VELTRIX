from django.test import TestCase


class HealthTests(TestCase):
    def test_health_ok(self):
        r = self.client.get("/api/v1/health/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json(), {"status": "ok"})