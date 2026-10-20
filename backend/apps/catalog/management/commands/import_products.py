import json
import re
from decimal import Decimal, InvalidOperation
from pathlib import Path

from django.core.files import File
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.catalog.models import (
    Attribute, Brand, Category, Product, ProductAttributeValue, ProductImage, ProductVariant,
)

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}
CONDITIONS = {value for value, _ in ProductVariant.Condition.choices}


class DryRun(Exception):
    pass


class Command(BaseCommand):
    help = "Импорт каталога из JSON. Повторный запуск обновляет данные, а не дублирует их."

    def add_arguments(self, parser):
        parser.add_argument("file", help="Путь к JSON-файлу")
        parser.add_argument("--images", help="Папка с фото: <slug>.jpg, <slug>-2.jpg, ...")
        parser.add_argument("--dry-run", action="store_true", help="Только проверить данные")
        parser.add_argument(
            "--reset-stock",
            action="store_true",
            help="Перезаписать остатки значениями из файла (по умолчанию остатки существующих вариантов не трогаются)",
        )

    def handle(self, *args, **opts):
        path = Path(opts["file"])
        if not path.is_file():
            raise CommandError(f"Файл не найден: {path}")
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            raise CommandError(f"Некорректный JSON: {exc}") from exc

        images_dir = Path(opts["images"]) if opts["images"] else None
        if images_dir and not images_dir.is_dir():
            raise CommandError(f"Папка с фото не найдена: {images_dir}")

        self.dry_run = opts["dry_run"]
        self.reset_stock = opts["reset_stock"]
        self.images_dir = None if self.dry_run else images_dir  # в dry-run файлы не копируем
        self.stats = {"products": 0, "variants": 0, "images": 0}

        try:
            with transaction.atomic():
                try:
                    self.load(data)
                except (KeyError, TypeError, ValueError) as exc:
                    raise CommandError(f"Ошибка в данных: {exc!r}") from exc
                if self.dry_run:
                    raise DryRun
        except DryRun:
            self.stdout.write("Проверка прошла, изменения не сохранены (--dry-run).")

        s = self.stats
        self.stdout.write(
            self.style.SUCCESS(f"Товаров: {s['products']}, вариантов: {s['variants']}, фото: {s['images']}")
        )

    def load(self, data):
        for c in data.get("categories", []):
            parent = None
            if c.get("parent"):
                parent = Category.objects.filter(slug=c["parent"]).first()
                if parent is None:
                    raise CommandError(f"Категория {c['slug']}: родитель {c['parent']} не найден")
            Category.objects.update_or_create(
                slug=c["slug"], defaults={"name": c["name"], "parent": parent}
            )
        for b in data.get("brands", []):
            Brand.objects.update_or_create(slug=b["slug"], defaults={"name": b["name"]})
        for a in data.get("attributes", []):
            Attribute.objects.update_or_create(slug=a["slug"], defaults={"name": a["name"]})
        for p in data.get("products", []):
            self.load_product(p)

    def load_product(self, p):
        slug = p["slug"]
        brand = Brand.objects.filter(slug=p["brand"]).first()
        category = Category.objects.filter(slug=p["category"]).first()
        if brand is None or category is None:
            raise CommandError(f"{slug}: неизвестный бренд или категория")

        product, _ = Product.objects.update_or_create(
            slug=slug,
            defaults={
                "name": p["name"],
                "brand": brand,
                "category": category,
                "description": p.get("description", ""),
                "is_active": p.get("is_active", True),
            },
        )
        self.stats["products"] += 1

        for attr_slug, value in (p.get("attributes") or {}).items():
            attribute = Attribute.objects.filter(slug=attr_slug).first()
            if attribute is None:
                raise CommandError(f"{slug}: неизвестная характеристика {attr_slug}")
            ProductAttributeValue.objects.update_or_create(
                product=product, attribute=attribute, defaults={"value": str(value)}
            )

        for v in p.get("variants", []):
            self.load_variant(product, v)
        self.attach_images(product)

    def load_variant(self, product, v):
        sku = v["sku"]
        if v["condition"] not in CONDITIONS:
            raise CommandError(f"{sku}: неизвестное состояние {v['condition']!r}")
        try:
            price = Decimal(str(v["price"]))
        except InvalidOperation:
            raise CommandError(f"{sku}: некорректная цена {v['price']!r}") from None
        stock = int(v.get("stock", 0))
        warranty = int(v.get("warranty_months", 0))
        if not price.is_finite() or price < 0 or stock < 0 or warranty < 0:
            raise CommandError(f"{sku}: цена, остаток и гарантия должны быть неотрицательными числами")

        defaults = {
            "product": product,
            "title": v.get("title", ""),
            "condition": v["condition"],
            "price": price,
            "currency": v.get("currency", "KGS"),
            "warranty_months": warranty,
            "is_active": v.get("is_active", True),
        }
        # остатки живых вариантов (после заказов) не затираем, если не просили явно
        if self.reset_stock or not ProductVariant.objects.filter(sku=sku).exists():
            defaults["stock"] = stock
        ProductVariant.objects.update_or_create(sku=sku, defaults=defaults)
        self.stats["variants"] += 1

    def attach_images(self, product):
        if self.images_dir is None or product.images.exists():
            return
        pattern = re.compile(rf"^{re.escape(product.slug)}(?:-(\d+))?$")
        found = []
        for f in self.images_dir.iterdir():
            if f.is_file() and f.suffix.lower() in IMAGE_EXTS:
                m = pattern.match(f.stem)
                if m:
                    found.append((int(m.group(1) or 0), f))
        for position, f in enumerate(sorted(found, key=lambda t: t[0])):
            with f.open("rb") as fh:
                image = ProductImage(product=product, alt=product.name, position=position)
                image.image.save(f.name, File(fh), save=True)
            self.stats["images"] += 1