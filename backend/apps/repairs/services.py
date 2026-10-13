from django.db import transaction
from rest_framework.exceptions import PermissionDenied, ValidationError

from .models import RepairRequest, RepairStatusEvent

TRANSITIONS = {
    "submitted": {"accepted", "cancelled"},
    "accepted": {"diagnostics", "cancelled"},
    "diagnostics": {"awaiting_approval", "cancelled"},
    "awaiting_approval": {"approved", "cancelled"},
    "approved": {"in_progress", "cancelled"},
    "in_progress": {"ready"},
    "ready": {"delivered"},
    "delivered": set(),
    "cancelled": set(),
}
MASTER_STATUSES = {"accepted", "diagnostics", "in_progress", "ready", "delivered"}
CUSTOMER_STATUSES = {"approved", "cancelled"}
# Эти статусы нельзя поставить напрямую: смета отправляется отдельным действием,
# а согласие может дать только клиент.
ADMIN_BLOCKED = {"awaiting_approval", "approved"}


def available_statuses(user, repair) -> list[str]:
    nxt = TRANSITIONS[repair.status]
    if user.role == "admin":
        return sorted(nxt - ADMIN_BLOCKED)
    allowed: set[str] = set()
    if user.role == "master" and repair.master_id == user.pk:
        allowed |= nxt & MASTER_STATUSES
    if repair.customer_id == user.pk:
        allowed |= nxt & CUSTOMER_STATUSES
    return sorted(allowed)


def can_quote(user, repair) -> bool:
    is_staff = user.role == "admin" or (user.role == "master" and repair.master_id == user.pk)
    return is_staff and repair.status == "diagnostics"


def _apply(repair, actor, to_status, note=""):
    RepairStatusEvent.objects.create(
        repair=repair, actor=actor, from_status=repair.status, to_status=to_status, note=note
    )
    repair.status = to_status
    repair.save()


def create_request(*, customer, device, issue, phone) -> RepairRequest:
    with transaction.atomic():
        repair = RepairRequest.objects.create(
            customer=customer, device=device, issue=issue, phone=phone
        )
        RepairStatusEvent.objects.create(repair=repair, actor=customer, to_status="submitted")
    return repair


def change_status(*, repair_id, actor, to_status, note="") -> RepairRequest:
    with transaction.atomic():
        repair = RepairRequest.objects.select_for_update().get(pk=repair_id)
        if to_status not in available_statuses(actor, repair):
            raise ValidationError({"status": "Этот переход недоступен."})
        _apply(repair, actor, to_status, note)
    return repair


def set_quote(*, repair_id, actor, amount, note="") -> RepairRequest:
    with transaction.atomic():
        repair = RepairRequest.objects.select_for_update().get(pk=repair_id)
        if actor.role != "admin" and not (actor.role == "master" and repair.master_id == actor.pk):
            raise PermissionDenied("Недостаточно прав.")
        if repair.status != "diagnostics":
            raise ValidationError({"detail": "Смету можно отправить только на этапе диагностики."})
        repair.quote_amount = amount
        repair.quote_note = note
        _apply(repair, actor, "awaiting_approval", f"Смета: {amount}. {note}".strip())
    return repair