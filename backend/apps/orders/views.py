from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from . import selectors, services
from .serializers import OrderCreateSerializer, OrderSerializer


class OrderListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get_throttles(self):
        if self.request.method == "POST":
            self.throttle_scope = "order_create"
            return [ScopedRateThrottle()]
        return []

    def get(self, request):
        qs = selectors.user_orders(request.user)[:50]
        return Response(OrderSerializer(qs, many=True).data)

    def post(self, request):
        serializer = OrderCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        order, created = services.create_order(
            user=request.user,
            items=data["items"],
            key=data["idempotency_key"],
            full_name=data["full_name"],
            phone=data["phone"],
            address=data["address"],
            comment=data["comment"],
        )
        order = selectors.user_orders(request.user).get(pk=order.pk)
        return Response(OrderSerializer(order).data, status=201 if created else 200)


class OrderDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        order = get_object_or_404(selectors.user_orders(request.user), pk=pk)
        return Response(OrderSerializer(order).data)


class OrderCancelView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        get_object_or_404(selectors.user_orders(request.user), pk=pk)
        services.cancel_order(order_id=pk, actor=request.user)
        order = selectors.user_orders(request.user).get(pk=pk)
        return Response(OrderSerializer(order).data)