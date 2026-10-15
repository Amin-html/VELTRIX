import uuid
from decimal import Decimal

from django.core.cache import cache
from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.catalog.models import Brand, Category, Product, ProductVariant
from apps.orders.models import Order

PW = "Str0ng-pass-123"
URL = "/api/v1/orders/"


def client_for(user=None):
    c = APIClient()
    if user:
        c.force_authenticate(user)
    return c


class OrderApiTests(TestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user("c@example.com", PW, email_verified=True)
        self.other = User.objects.create_user("o@example.com", PW, email_verified=True)
        cat = Category.objects.create(name="Смартфоны", slug="smartphones")
        brand = Brand.objects.create(name="Apple", slug="apple")
        self.product = Product.objects.create(name="iPhone 13", slug="iphone-13", brand=brand, category=cat)
        self.variant = ProductVariant.objects.create(
            product=self.product, sku="IP13", price=Decimal("50000"), stock=3
        )

    def payload(self, qty=1, key=None, items=None, **extra):
        return {
            "items": items or [{"variant": str(self.variant.pk), "quantity": qty}],
            "full_name": "Иван",
            "phone": "+996700123456",
            "address": "Бишкек, ул. Ленина 1",
            "idempotency_key": str(key or uuid.uuid4()),
            **extra,
        }

    def order(self, user=None, **kw):
        return client_for(user or self.user).post(URL, self.payload(**kw), format="json")

    def stock(self):
        self.variant.refresh_from_db()
        return self.variant.stock

    def test_requires_auth(self):
        r = client_for().post(URL, self.payload(), format="json")
        self.assertIn(r.status_code, (401, 403))

    def test_create_decrements_stock_and_computes_total(self):
        r = self.order(qty=2)
        self.assertEqual(r.status_code, 201)
        self.assertEqual(Decimal(r.data["total"]), Decimal("100000"))
        self.assertEqual(self.stock(), 1)

    def test_client_cannot_set_price(self):
        r = client_for(self.user).post(
            URL, {**self.payload(), "total": "1", "price": "1"}, format="json"
        )
        self.assertEqual(r.status_code, 201)
        self.assertEqual(Decimal(r.data["total"]), Decimal("50000"))

    def test_not_enough_stock_changes_nothing(self):
        r = self.order(qty=4)
        self.assertEqual(r.status_code, 400)
        self.assertEqual(self.stock(), 3)
        self.assertEqual(Order.objects.count(), 0)

    def test_idempotency_key_prevents_duplicates(self):
        key = uuid.uuid4()
        first = self.order(key=key)
        second = self.order(key=key)
        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(first.data["id"], second.data["id"])
        self.assertEqual(Order.objects.count(), 1)
        self.assertEqual(self.stock(), 2)

    def test_duplicate_lines_are_aggregated(self):
        vid = str(self.variant.pk)
        items = [{"variant": vid, "quantity": 2}, {"variant": vid, "quantity": 2}]
        r = self.order(items=items)
        self.assertEqual(r.status_code, 400)
        self.assertEqual(self.stock(), 3)

    def test_inactive_product_rejected(self):
        Product.objects.filter(pk=self.product.pk).update(is_active=False)
        self.assertEqual(self.order().status_code, 400)

    def test_invalid_quantity_rejected(self):
        self.assertEqual(self.order(qty=0).status_code, 400)
        self.assertEqual(self.order(qty=11).status_code, 400)

    def test_unverified_email_forbidden(self):
        user = User.objects.create_user("u@example.com", PW)
        self.assertEqual(self.order(user=user).status_code, 403)

    def test_other_user_gets_404(self):
        oid = self.order().data["id"]
        self.assertEqual(client_for(self.other).get(f"{URL}{oid}/").status_code, 404)

    def test_cancel_restores_stock(self):
        oid = self.order(qty=2).data["id"]
        self.assertEqual(self.stock(), 1)
        r = client_for(self.user).post(f"{URL}{oid}/cancel/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["status"], "cancelled")
        self.assertEqual(self.stock(), 3)

    def test_cannot_cancel_confirmed_order(self):
        oid = self.order().data["id"]
        Order.objects.filter(pk=oid).update(status="confirmed")
        r = client_for(self.user).post(f"{URL}{oid}/cancel/")
        self.assertEqual(r.status_code, 400)
        self.assertEqual(self.stock(), 2)

    def test_variant_lookup(self):
        r = client_for().get("/api/v1/catalog/variants/", {"ids": str(self.variant.pk)})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(r.data), 1)
        Product.objects.filter(pk=self.product.pk).update(is_active=False)
        r = client_for().get("/api/v1/catalog/variants/", {"ids": str(self.variant.pk)})
        self.assertEqual(r.data, [])

    def test_variant_lookup_bad_ids(self):
        r = client_for().get("/api/v1/catalog/variants/", {"ids": "not-a-uuid"})
        self.assertEqual(r.status_code, 400)

    def test_pickup_does_not_require_address(self):
        r = self.order(address="", delivery_method="pickup")
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["delivery_method"], "pickup")
        self.assertEqual(r.data["address"], "")

    def test_delivery_requires_address(self):
        r = self.order(address="", delivery_method="delivery")
        self.assertEqual(r.status_code, 400)
        self.assertEqual(self.stock(), 3)

    def test_invalid_delivery_method_rejected(self):
        self.assertEqual(self.order(delivery_method="drone").status_code, 400)