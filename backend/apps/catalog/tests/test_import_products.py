import copy
import io
import json
import tempfile
from decimal import Decimal
from pathlib import Path
from PIL import Image

from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase
from django.test import override_settings

from apps.catalog.models import Product, ProductAttributeValue, ProductVariant

DATA = {
    "categories": [{"slug": "smartphones", "name": "Смартфоны"}],
    "brands": [{"slug": "apple", "name": "Apple"}],
    "attributes": [{"slug": "screen", "name": "Диагональ экрана"}],
    "products": [
        {
            "slug": "iphone-14", "name": "iPhone 14", "brand": "apple", "category": "smartphones",
            "attributes": {"screen": "6,1\""},
            "variants": [
                {"sku": "IP14-128-G", "title": "128 GB", "condition": "good",
                 "price": "52000", "stock": 2, "warranty_months": 3},
            ],
        }
    ],
}


class ImportProductsTests(TestCase):
    def run_import(self, data, *args):
        f = tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8")
        json.dump(data, f, ensure_ascii=False)
        f.close()
        self.addCleanup(Path(f.name).unlink)
        call_command("import_products", f.name, *args, stdout=io.StringIO())

    def test_creates_catalog(self):
        self.run_import(DATA)
        self.assertEqual(Product.objects.count(), 1)
        self.assertEqual(ProductVariant.objects.count(), 1)
        self.assertEqual(ProductAttributeValue.objects.count(), 1)

    def test_import_is_idempotent(self):
        self.run_import(DATA)
        self.run_import(DATA)
        self.assertEqual(Product.objects.count(), 1)
        self.assertEqual(ProductVariant.objects.count(), 1)
        self.assertEqual(ProductAttributeValue.objects.count(), 1)

    def test_reimport_updates_price_but_keeps_stock(self):
        self.run_import(DATA)
        ProductVariant.objects.filter(sku="IP14-128-G").update(stock=1)
        changed = copy.deepcopy(DATA)
        changed["products"][0]["variants"][0]["price"] = "53000"
        self.run_import(changed)
        variant = ProductVariant.objects.get(sku="IP14-128-G")
        self.assertEqual(variant.price, Decimal("53000"))
        self.assertEqual(variant.stock, 1)
        self.run_import(changed, "--reset-stock")
        variant.refresh_from_db()
        self.assertEqual(variant.stock, 2)

    def test_dry_run_saves_nothing(self):
        self.run_import(DATA, "--dry-run")
        self.assertEqual(Product.objects.count(), 0)

    def test_invalid_condition_rolls_back_everything(self):
        bad = copy.deepcopy(DATA)
        bad["products"][0]["variants"][0]["condition"] = "broken"
        with self.assertRaises(CommandError):
            self.run_import(bad)
        self.assertEqual(Product.objects.count(), 0)

    def test_unknown_brand_rejected(self):
        bad = copy.deepcopy(DATA)
        bad["products"][0]["brand"] = "nokia"
        with self.assertRaises(CommandError):
            self.run_import(bad)

    def test_missing_file(self):
        with self.assertRaises(CommandError):
            call_command("import_products", "/no/such/file.json", stdout=io.StringIO())


    def test_images_are_attached_in_order_and_not_duplicated(self):
        with tempfile.TemporaryDirectory() as media, tempfile.TemporaryDirectory() as imgs:
            for name in ("iphone-14.png", "iphone-14-2.png", "iphone-14-pro.png"):
                Image.new("RGB", (10, 10), "blue").save(Path(imgs) / name)
            with override_settings(MEDIA_ROOT=media):
                self.run_import(DATA, "--images", imgs)
                product = Product.objects.get(slug="iphone-14")
                self.assertEqual(product.images.count(), 2)  # iphone-14-pro чужой
                self.assertEqual([i.position for i in product.images.all()], [0, 1])
                self.run_import(DATA, "--images", imgs)
                self.assertEqual(product.images.count(), 2)  # без дублей