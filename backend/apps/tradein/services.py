from django.db import transaction
from rest_framework.exceptions import ValidationError

from .models import TradeInRequest

CUSTOMER_TRANSITIONS = {
    "submitted": {"cancelled"},
    "offered": {"accepted", "declined", "cancelled"},
}


def available_actions(obj) -> list[str]:
    return sorted(CUSTOMER_TRANSITIONS.get(obj.status, set()))


def create_request(*, customer, **data) -> TradeInRequest:
    return TradeInRequest.objects.create(customer=customer, **data)


def customer_respond(*, request_id, customer, to_status) -> TradeInRequest:
    with transaction.atomic():
        obj = TradeInRequest.objects.select_for_update().get(pk=request_id, customer=customer)
        if to_status not in CUSTOMER_TRANSITIONS.get(obj.status, set()):
            raise ValidationError({"status": "Это действие сейчас недоступно."})
        obj.status = to_status
        obj.save(update_fields=["status", "updated_at"])
    return obj