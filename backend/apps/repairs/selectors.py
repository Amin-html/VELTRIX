from django.db.models import Q

from .models import RepairRequest


def _base():
    return RepairRequest.objects.select_related("customer", "master").prefetch_related("events")


def visible_repairs(user):
    if user.role == "admin":
        return _base()
    return _base().filter(Q(customer=user) | Q(master=user)).distinct()


def customer_repairs(user):
    return _base().filter(customer=user)


def master_repairs(user):
    qs = _base()
    return qs if user.role == "admin" else qs.filter(master=user)