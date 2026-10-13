from decimal import Decimal

from rest_framework import serializers

from . import services
from .models import RepairRequest, RepairStatusEvent


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = RepairStatusEvent
        fields = ["from_status", "to_status", "note", "created_at"]


class RepairSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    events = EventSerializer(many=True, read_only=True)
    allowed_statuses = serializers.SerializerMethodField()
    can_quote = serializers.SerializerMethodField()

    class Meta:
        model = RepairRequest
        fields = [
            "id", "device", "issue", "phone", "status", "status_display",
            "quote_amount", "quote_note", "created_at", "updated_at",
            "events", "allowed_statuses", "can_quote",
        ]

    def get_allowed_statuses(self, obj):
        return services.available_statuses(self.context["request"].user, obj)

    def get_can_quote(self, obj):
        return services.can_quote(self.context["request"].user, obj)


class RepairCreateSerializer(serializers.Serializer):
    device = serializers.CharField(max_length=120)
    issue = serializers.CharField(max_length=2000)
    phone = serializers.RegexField(r"^[+0-9()\s-]{7,32}$", max_length=32)


class StatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=RepairRequest.Status.choices)
    note = serializers.CharField(max_length=500, required=False, allow_blank=True, default="")


class QuoteSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal("0.01"))
    note = serializers.CharField(max_length=500, required=False, allow_blank=True, default="")