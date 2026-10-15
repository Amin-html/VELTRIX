from django.contrib import admin, messages
from rest_framework.exceptions import PermissionDenied, ValidationError

from . import services
from .models import Order, OrderItem


class ItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    can_delete = False
    readonly_fields = ("variant", "product_name", "variant_title", "sku", "unit_price", "quantity")

    def has_add_permission(self, request, obj=None):
        return False


@admin.action(description="Подтвердить заказы")
def confirm(modeladmin, request, queryset):
    queryset.filter(status="new").update(status="confirmed")


@admin.action(description="Отметить выполненными")
def complete(modeladmin, request, queryset):
    queryset.filter(status="confirmed").update(status="completed")


@admin.action(description="Отменить и вернуть остатки")
def cancel(modeladmin, request, queryset):
    for order in queryset:
        try:
            services.cancel_order(order_id=order.pk, actor=request.user)
        except (ValidationError, PermissionDenied):
            modeladmin.message_user(request, f"{order}: отменить нельзя.", level=messages.WARNING)


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("short_id", "user", "status", "delivery_method", "total", "created_at")
    list_filter = ("status", "delivery_method")
    search_fields = ("user__email", "phone", "full_name")
    readonly_fields = [f.name for f in Order._meta.fields]
    inlines = [ItemInline]
    actions = [confirm, complete, cancel]

    @admin.display(description="Номер")
    def short_id(self, obj):
        return str(obj.pk)[:8]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False