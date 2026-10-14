import uuid

from django.conf import settings
from django.db import models


class TradeInRequest(models.Model):
    class Status(models.TextChoices):
        SUBMITTED = "submitted", "Отправлена"
        OFFERED = "offered", "Есть предложение"
        ACCEPTED = "accepted", "Предложение принято"
        DECLINED = "declined", "Отклонена"
        COMPLETED = "completed", "Завершена"
        CANCELLED = "cancelled", "Отменена"

    class Condition(models.TextChoices):
        EXCELLENT = "excellent", "Отличное"
        GOOD = "good", "Хорошее"
        FAIR = "fair", "Удовлетворительное"
        BROKEN = "broken", "Неисправное"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="tradein_requests"
    )
    device = models.CharField(max_length=120)
    condition = models.CharField(max_length=20, choices=Condition.choices)
    description = models.TextField(max_length=1000, blank=True)
    phone = models.CharField(max_length=32)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SUBMITTED)
    offer_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    offer_note = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.device} ({self.get_status_display()})"