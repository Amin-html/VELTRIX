from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from . import services
from .models import TradeInRequest
from .serializers import RespondSerializer, TradeInCreateSerializer, TradeInSerializer


def own(user):
    return TradeInRequest.objects.filter(customer=user)


class TradeInListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get_throttles(self):
        if self.request.method == "POST":
            self.throttle_scope = "tradein_create"
            return [ScopedRateThrottle()]
        return []

    def get(self, request):
        return Response(TradeInSerializer(own(request.user)[:50], many=True).data)

    def post(self, request):
        serializer = TradeInCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        obj = services.create_request(customer=request.user, **serializer.validated_data)
        return Response(TradeInSerializer(obj).data, status=201)


class TradeInDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        return Response(TradeInSerializer(get_object_or_404(own(request.user), pk=pk)).data)


class TradeInRespondView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        get_object_or_404(own(request.user), pk=pk)
        serializer = RespondSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        obj = services.customer_respond(
            request_id=pk, customer=request.user, to_status=serializer.validated_data["status"]
        )
        return Response(TradeInSerializer(obj).data)