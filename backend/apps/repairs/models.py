import uuid

from django.conf import settings
from django.db import models


class RepairRequest(models.Model):
    class Status(models.TextChoices):
        SUBMITTED = "submitted", "Отправлена"
        ACCEPTED = "accepted", "Принята"
        DIAGNOSTICS = "diagnostics", "Диагностика"
        AWAITING_APPROVAL = "awaiting_approval", "Ждёт согласования сметы"
        APPROVED = "approved", "Смета согласована"
        IN_PROGRESS = "in_progress", "В работе"
        READY = "ready", "Готова к выдаче"
        DELIVERED = "delivered", "Выдана"
        CANCELLED = "cancelled", "Отменена"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="repair_requests"
    )
    master = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="assigned_repairs",
        limit_choices_to={"role": "master"},
    )
    device = models.CharField(max_length=120)
    issue = models.TextField(max_length=2000)
    phone = models.CharField(max_length=32)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SUBMITTED)
    quote_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    quote_note = models.TextField(max_length=1000, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.device} ({self.get_status_display()})"


class RepairStatusEvent(models.Model):
    repair = models.ForeignKey(RepairRequest, on_delete=models.CASCADE, related_name="events")
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name="+"
    )
    from_status = models.CharField(max_length=20, blank=True)
    to_status = models.CharField(max_length=20)
    note = models.TextField(max_length=1000, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at", "id"]