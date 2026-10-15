from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.catalog.models import Brand, Category, Favorite, Product, ProductVariant

PW = "Str0ng-pass-123"
URL = "/api/v1/catalog/favorites/"


def client_for(user=None):
    c = APIClient()
    if user:
        c.force_authenticate(user)
    return c


class FavoritesApiTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user("a@example.com", PW)
        self.other = User.objects.create_user("b@example.com", PW)
        cat = Category.objects.create(name="Смартфоны", slug="smartphones")
        brand = Brand.objects.create(name="Apple", slug="apple")
        self.product = Product.objects.create(name="iPhone 13", slug="iphone-13", brand=brand, category=cat)
        ProductVariant.objects.create(product=self.product, sku="IP13", price=Decimal("50000"), stock=2)

    def add(self, user, slug="iphone-13"):
        return client_for(user).post(URL, {"slug": slug}, format="json")

    def test_requires_auth(self):
        self.assertIn(client_for().get(URL).status_code, (401, 403))
        self.assertIn(client_for().post(URL, {"slug": "iphone-13"}, format="json").status_code, (401, 403))

    def test_add_list_remove(self):
        self.assertEqual(self.add(self.user).status_code, 201)
        r = client_for(self.user).get(URL)
        self.assertEqual([p["slug"] for p in r.data], ["iphone-13"])
        self.assertEqual(client_for(self.user).delete(f"{URL}iphone-13/").status_code, 204)
        self.assertEqual(client_for(self.user).get(URL).data, [])

    def test_add_is_idempotent(self):
        self.assertEqual(self.add(self.user).status_code, 201)
        self.assertEqual(self.add(self.user).status_code, 200)
        self.assertEqual(Favorite.objects.count(), 1)

    def test_inactive_product_cannot_be_added(self):
        Product.objects.filter(pk=self.product.pk).update(is_active=False)
        self.assertEqual(self.add(self.user).status_code, 404)

    def test_favorites_are_private(self):
        self.add(self.user)
        self.assertEqual(client_for(self.other).get(URL).data, [])
        self.assertEqual(client_for(self.other).delete(f"{URL}iphone-13/").status_code, 204)
        self.assertEqual(Favorite.objects.count(), 1)

    def test_missing_slug_rejected(self):
        self.assertEqual(client_for(self.user).post(URL, {}, format="json").status_code, 400)