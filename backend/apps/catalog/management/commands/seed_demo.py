from decimal import Decimal

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from apps.catalog.models import Brand, Category, Product, ProductVariant


class Command(BaseCommand):
    help = "Демо-данные каталога (только для разработки)"

    def handle(self, *args, **options):
        if not settings.DEBUG:
            raise CommandError("seed_demo разрешён только при DEBUG=True")

        phones, _ = Category.objects.get_or_create(slug="smartphones", defaults={"name": "Смартфоны"})
        laptops, _ = Category.objects.get_or_create(slug="laptops", defaults={"name": "Ноутбуки"})
        apple, _ = Brand.objects.get_or_create(slug="apple", defaults={"name": "Apple"})
        samsung, _ = Brand.objects.get_or_create(slug="samsung", defaults={"name": "Samsung"})

        items = [
            ("iPhone 13", "iphone-13", apple, phones, [("IP13-128-G", "128 GB", "good", "42000", 3), ("IP13-128-N", "128 GB", "new", "62000", 0)]),
            ("Galaxy S23", "galaxy-s23", samsung, phones, [("S23-256-N", "256 GB", "new", "58000", 5)]),
            ("MacBook Air M1", "macbook-air-m1", apple, laptops, [("MBA-M1-8-G", "8/256", "like_new", "68000", 1)]),
        ]
        for name, slug, brand, cat, variants in items:
            product, _ = Product.objects.get_or_create(
                slug=slug, defaults={"name": name, "brand": brand, "category": cat}
            )
            for sku, title, cond, price, stock in variants:
                ProductVariant.objects.get_or_create(
                    sku=sku,
                    defaults={"product": product, "title": title, "condition": cond,
                              "price": Decimal(price), "stock": stock, "warranty_months": 3},
                )
        self.stdout.write(self.style.SUCCESS("Демо-данные созданы"))