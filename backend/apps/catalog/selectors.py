from django.db.models import Exists, Min, OuterRef, Prefetch, Q, Sum

from .models import Product, ProductVariant, Favorite

ORDERING = {"price": "min_price", "-price": "-min_price", "newest": "-created_at", "name": "name"}


def product_list(*, params: dict):
    active = Q(variants__is_active=True)
    qs = (
        Product.objects.filter(is_active=True)
        .select_related("brand", "category")
        .prefetch_related("images")
        .annotate(
            min_price=Min("variants__price", filter=active),
            total_stock=Sum("variants__stock", filter=active),
        )
        .filter(min_price__isnull=False)
    )

    if slug := params.get("category"):
        qs = qs.filter(Q(category__slug=slug) | Q(category__parent__slug=slug))
    if slug := params.get("brand"):
        qs = qs.filter(brand__slug=slug)
    if text := params.get("q"):
        qs = qs.filter(Q(name__icontains=text) | Q(brand__name__icontains=text))

    # Фильтры по варианту идут через Exists, чтобы не ломать агрегаты
    variant_filter = {}
    if "condition" in params:
        variant_filter["condition"] = params["condition"]
    if "price_min" in params:
        variant_filter["price__gte"] = params["price_min"]
    if "price_max" in params:
        variant_filter["price__lte"] = params["price_max"]
    if variant_filter:
        qs = qs.filter(
            Exists(
                ProductVariant.objects.filter(
                    product=OuterRef("pk"), is_active=True, **variant_filter
                )
            )
        )

    return qs.order_by(ORDERING.get(params.get("ordering"), "-created_at"), "id")


def product_detail_queryset():
    return (
        Product.objects.filter(is_active=True)
        .select_related("brand", "category")
        .prefetch_related(
            "images",
            "attributes__attribute",
            Prefetch(
                "variants",
                queryset=ProductVariant.objects.filter(is_active=True),
                to_attr="active_variants",
            ),
        )
    )

def favorite_products(user):
    ids = Favorite.objects.filter(user=user).values("product_id")
    return product_list(params={}).filter(pk__in=ids)