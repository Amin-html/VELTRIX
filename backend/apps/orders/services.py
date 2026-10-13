from collections import defaultdict
from decimal import Decimal

from django.db import IntegrityError, transaction
from django.db.models import F
from rest_framework.exceptions import PermissionDenied, ValidationError

from apps.catalog.models import ProductVariant

from .models import Order, OrderItem

MAX_LINES = 20
MAX_QTY = 10


def create_order(*, user, items, key, full_name, phone, address, comment=""):
    """Возвращает (order, created). Повтор с тем же ключом отдаёт прежний заказ."""
    if not user.email_verified:
        raise PermissionDenied("Подтвердите email в профиле, чтобы оформить заказ.")

    existing = Order.objects.filter(user=user, idempotency_key=key).first()
    if existing:
        return existing, False

    wanted: dict = defaultdict(int)
    for item in items:
        wanted[item["variant"]] += item["quantity"]
    if not wanted:
        raise ValidationError({"items": "Корзина пуста."})
    if len(wanted) > MAX_LINES or any(q > MAX_QTY for q in wanted.values()):
        raise ValidationError({"items": f"Не больше {MAX_LINES} позиций и {MAX_QTY} шт. каждой."})

    try:
        with transaction.atomic():
            variants = {
                v.pk: v
                for v in ProductVariant.objects.select_for_update(of=("self",))
                .select_related("product")
                .filter(pk__in=list(wanted), is_active=True, product__is_active=True)
                .order_by("pk")
            }
            # параллельный запрос с тем же ключом мог успеть раньше
            existing = Order.objects.filter(user=user, idempotency_key=key).first()
            if existing:
                return existing, False

            if len(variants) != len(wanted):
                raise ValidationError({"items": "Некоторые товары больше недоступны. Обновите корзину."})
            currencies = {v.currency for v in variants.values()}
            if len(currencies) != 1:
                raise ValidationError({"items": "В одном заказе нельзя смешивать валюты."})
            for pk, qty in wanted.items():
                variant = variants[pk]
                if variant.stock < qty:
                    raise ValidationError(
                        {"items": f"Недостаточно товара «{variant.product.name}» (доступно: {variant.stock})."}
                    )

            total = sum((variants[pk].price * qty for pk, qty in wanted.items()), Decimal("0"))
            order = Order.objects.create(
                user=user, full_name=full_name, phone=phone, address=address, comment=comment,
                total=total, currency=currencies.pop(), idempotency_key=key,
            )
            for pk, qty in wanted.items():
                variant = variants[pk]
                OrderItem.objects.create(
                    order=order, variant=variant, product_name=variant.product.name,
                    variant_title=variant.title, sku=variant.sku,
                    unit_price=variant.price, quantity=qty,
                )
                ProductVariant.objects.filter(pk=pk).update(stock=F("stock") - qty)
    except IntegrityError:
        existing = Order.objects.filter(user=user, idempotency_key=key).first()
        if existing:
            return existing, False
        raise
    return order, True


def cancel_order(*, order_id, actor) -> Order:
    with transaction.atomic():
        order = Order.objects.select_for_update().get(pk=order_id)
        if actor.role != "admin" and order.user_id != actor.pk:
            raise PermissionDenied("Недостаточно прав.")
        allowed = {"new", "confirmed"} if actor.role == "admin" else {"new"}
        if order.status not in allowed:
            raise ValidationError({"detail": "Этот заказ нельзя отменить."})
        for item in order.items.all():
            ProductVariant.objects.filter(pk=item.variant_id).update(stock=F("stock") + item.quantity)
        order.status = Order.Status.CANCELLED
        order.save(update_fields=["status"])
    return order