from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APIClient

from apps.catalog.models import Brand, Category, Product, ProductVariant


class ProductApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        cat = Category.objects.create(name="Смартфоны", slug="smartphones")
        brand = Brand.objects.create(name="Apple", slug="apple")
        p = Product.objects.create(name="iPhone 13", slug="iphone-13", brand=brand, category=cat)
        ProductVariant.objects.create(product=p, sku="IP13", price=Decimal("50000"), stock=2, condition="good")
        hidden = Product.objects.create(name="Hidden", slug="hidden", brand=brand, category=cat, is_active=False)
        ProductVariant.objects.create(product=hidden, sku="H1", price=Decimal("1"), stock=1)

    def test_list_hides_inactive_products(self):
        r = self.client.get("/api/v1/catalog/products/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual([x["slug"] for x in r.data["results"]], ["iphone-13"])

    def test_price_filter(self):
        r = self.client.get("/api/v1/catalog/products/", {"price_max": "1000"})
        self.assertEqual(r.data["count"], 0)

    def test_invalid_param_returns_400(self):
        r = self.client.get("/api/v1/catalog/products/", {"price_min": "abc"})
        self.assertEqual(r.status_code, 400)

    def test_inactive_product_detail_is_404(self):
        self.assertEqual(self.client.get("/api/v1/catalog/products/hidden/").status_code, 404)