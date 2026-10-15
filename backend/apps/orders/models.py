import uuid

from django.conf import settings
from django.db import models
from django.db.models import Q

from apps.catalog.models import ProductVariant


class Order(models.Model):
    class Status(models.TextChoices):
        NEW = "new", "Новый"
        CONFIRMED = "confirmed", "Подтверждён"
        COMPLETED = "completed", "Выполнен"
        CANCELLED = "cancelled", "Отменён"


    class DeliveryMethod(models.TextChoices):
        DELIVERY = "delivery", "Доставка"
        PICKUP = "pickup", "Самовывоз"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="orders")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NEW)
    full_name = models.CharField(max_length=120)
    phone = models.CharField(max_length=32)
    delivery_method = models.CharField(
        max_length=10, choices=DeliveryMethod.choices, default=DeliveryMethod.DELIVERY
    )
    address = models.CharField(max_length=300, blank=True)
    comment = models.CharField(max_length=500, blank=True)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default="KGS")
    idempotency_key = models.UUIDField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(fields=["user", "idempotency_key"], name="uniq_order_user_key"),
        ]

    def __str__(self):
        return f"Заказ {str(self.pk)[:8]}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    variant = models.ForeignKey(ProductVariant, on_delete=models.PROTECT, related_name="+")
    product_name = models.CharField(max_length=200)
    variant_title = models.CharField(max_length=120, blank=True)
    sku = models.CharField(max_length=64)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    quantity = models.PositiveSmallIntegerField()

    class Meta:
        ordering = ["id"]
        constraints = [
            models.CheckConstraint(check=Q(quantity__gte=1), name="orderitem_qty_gte_1"),
        ]