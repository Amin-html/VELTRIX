from django.shortcuts import get_object_or_404
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from . import selectors, services
from .serializers import (
    QuoteSerializer, RepairCreateSerializer, RepairSerializer, StatusSerializer,
)


def render(repair, request, status=200):
    return Response(RepairSerializer(repair, context={"request": request}).data, status=status)


class RepairListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get_throttles(self):
        if self.request.method == "POST":
            self.throttle_scope = "repair_create"
            return [ScopedRateThrottle()]
        return []

    def get(self, request):
        qs = selectors.customer_repairs(request.user)[:50]
        return Response(
            RepairSerializer(qs, many=True, context={"request": request}).data
        )

    def post(self, request):
        serializer = RepairCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        repair = services.create_request(customer=request.user, **serializer.validated_data)
        return render(repair, request, status=201)


class RepairDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        repair = get_object_or_404(selectors.visible_repairs(request.user), pk=pk)
        return render(repair, request)


class RepairStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        get_object_or_404(selectors.visible_repairs(request.user), pk=pk)
        serializer = StatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        repair = services.change_status(
            repair_id=pk,
            actor=request.user,
            to_status=serializer.validated_data["status"],
            note=serializer.validated_data["note"],
        )
        return render(repair, request)


class RepairQuoteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        get_object_or_404(selectors.visible_repairs(request.user), pk=pk)
        serializer = QuoteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        repair = services.set_quote(
            repair_id=pk,
            actor=request.user,
            amount=serializer.validated_data["amount"],
            note=serializer.validated_data["note"],
        )
        return render(repair, request)


class MasterRepairListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in ("master", "admin"):
            raise PermissionDenied("Раздел доступен только мастерам.")
        qs = selectors.master_repairs(request.user)[:100]
        return Response(
            RepairSerializer(qs, many=True, context={"request": request}).data
        )