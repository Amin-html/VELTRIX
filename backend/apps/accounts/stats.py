def profile_stats(user) -> dict:
    # импорты внутри функции: accounts не должен зависеть от других приложений при загрузке
    from apps.catalog.models import Favorite
    from apps.orders.models import Order
    from apps.repairs.models import RepairRequest
    from apps.tradein.models import TradeInRequest

    data = {
        "orders": Order.objects.filter(user=user).count(),
        "repairs": RepairRequest.objects.filter(customer=user).count(),
        "trade_ins": TradeInRequest.objects.filter(customer=user).count(),
        "favorites": Favorite.objects.filter(user=user).count(),
    }
    if user.role in ("master", "admin"):
        qs = RepairRequest.objects.all() if user.role == "admin" else RepairRequest.objects.filter(master=user)
        data["assigned_repairs"] = qs.exclude(status__in=["delivered", "cancelled"]).count()
        data["completed_repairs"] = qs.filter(status="delivered").count()
    return data