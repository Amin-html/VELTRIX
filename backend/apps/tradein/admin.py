from django.contrib import admin
from django.utils import timezone

from .models import TradeInRequest

LOCKED = ("customer", "device", "condition", "description", "phone", "status", "created_at", "updated_at")


@admin.action(description="Отправить предложение клиенту (цена должна быть указана)")
def send_offer(modeladmin, request, queryset):
    queryset.filter(status="submitted", offer_amount__isnull=False).update(
        status="offered", updated_at=timezone.now()
    )


@admin.action(description="Отклонить заявку")
def decline(modeladmin, request, queryset):
    queryset.filter(status="submitted").update(status="declined", updated_at=timezone.now())


@admin.action(description="Завершить сделку")
def complete(modeladmin, request, queryset):
    queryset.filter(status="accepted").update(status="completed", updated_at=timezone.now())


@admin.register(TradeInRequest)
class TradeInRequestAdmin(admin.ModelAdmin):
    list_display = ("device", "customer", "condition", "status", "offer_amount", "created_at")
    list_filter = ("status", "condition")
    search_fields = ("device", "customer__email", "phone")
    actions = [send_offer, decline, complete]

    def get_readonly_fields(self, request, obj=None):
        if obj and obj.status not in ("submitted", "offered"):
            return LOCKED + ("offer_amount", "offer_note")
        return LOCKED

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False