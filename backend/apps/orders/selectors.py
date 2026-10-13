from .models import Order


def user_orders(user):
    return Order.objects.filter(user=user).prefetch_related("items")