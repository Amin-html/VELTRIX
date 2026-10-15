from rest_framework import serializers
from django.conf import settings
from .models import Order, OrderItem


class OrderItemInputSerializer(serializers.Serializer):
    variant = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1, max_value=10)


class OrderCreateSerializer(serializers.Serializer):
    items = OrderItemInputSerializer(many=True, allow_empty=False, max_length=20)
    full_name = serializers.CharField(max_length=120)
    phone = serializers.RegexField(r"^[+0-9()\s-]{7,32}$", max_length=32)
    address = serializers.CharField(max_length=300, required=False, allow_blank=True, default="")
    delivery_method = serializers.ChoiceField(choices=Order.DeliveryMethod.choices, default="delivery")
    comment = serializers.CharField(max_length=500, required=False, allow_blank=True, default="")
    idempotency_key = serializers.UUIDField()


class OrderItemSerializer(serializers.ModelSerializer):
    line_total = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ["product_name", "variant_title", "sku", "unit_price", "quantity", "line_total"]

    def get_line_total(self, obj):
        return f"{obj.unit_price * obj.quantity:.2f}"


class OrderSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)
    can_cancel = serializers.SerializerMethodField()
    payment_method = serializers.SerializerMethodField()
    delivery_display = serializers.CharField(source="get_delivery_method_display", read_only=True)
    pickup_point = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id", "status", "status_display", "delivery_method", "delivery_display",
            "full_name", "phone", "address", "pickup_point", "comment",
            "total", "currency", "payment_method", "created_at", "items", "can_cancel",
        ]

    def get_pickup_point(self, obj):
        return settings.PICKUP_POINT_ADDRESS if obj.delivery_method == "pickup" else ""

    def get_can_cancel(self, obj):
        return obj.status == Order.Status.NEW

    def get_payment_method(self, obj):
        return "Оплата при получении"