from django.contrib import admin

from .models import RepairRequest, RepairStatusEvent


class EventInline(admin.TabularInline):
    model = RepairStatusEvent
    extra = 0
    can_delete = False
    readonly_fields = ("actor", "from_status", "to_status", "note", "created_at")

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(RepairRequest)
class RepairRequestAdmin(admin.ModelAdmin):
    list_display = ("device", "customer", "master", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("device", "customer__email")
    readonly_fields = ("status", "quote_amount", "quote_note", "created_at", "updated_at")
    inlines = [EventInline]