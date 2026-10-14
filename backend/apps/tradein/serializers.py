from rest_framework import serializers

from . import services
from .models import TradeInRequest


class TradeInSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    condition_display = serializers.CharField(source="get_condition_display", read_only=True)
    allowed_actions = serializers.SerializerMethodField()

    class Meta:
        model = TradeInRequest
        fields = [
            "id", "device", "condition", "condition_display", "description", "phone",
            "status", "status_display", "offer_amount", "offer_note", "created_at",
            "allowed_actions",
        ]

    def get_allowed_actions(self, obj):
        return services.available_actions(obj)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.status == TradeInRequest.Status.SUBMITTED:
            data["offer_amount"] = None
            data["offer_note"] = ""
        return data


class TradeInCreateSerializer(serializers.Serializer):
    device = serializers.CharField(max_length=120)
    condition = serializers.ChoiceField(choices=TradeInRequest.Condition.choices)
    description = serializers.CharField(max_length=1000, required=False, allow_blank=True, default="")
    phone = serializers.RegexField(r"^[+0-9()\s-]{7,32}$", max_length=32)


class RespondSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=["accepted", "declined", "cancelled"])