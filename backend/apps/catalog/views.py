import uuid

from django.shortcuts import get_object_or_404
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from . import selectors
from .models import Brand, Category, Favorite, Product, ProductVariant
from .serializers import (
    BrandSerializer,
    CartVariantSerializer,
    CategorySerializer,
    ProductDetailSerializer,
    ProductListSerializer,
    ProductQuerySerializer,
)

class ProductListView(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = ProductListSerializer

    def get_queryset(self):
        params = ProductQuerySerializer(data=self.request.query_params)
        params.is_valid(raise_exception=True)
        return selectors.product_list(params=params.validated_data)


class ProductDetailView(RetrieveAPIView):
    permission_classes = [AllowAny]
    serializer_class = ProductDetailSerializer
    lookup_field = "slug"

    def get_queryset(self):
        return selectors.product_detail_queryset()


class CategoryListView(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = CategorySerializer
    queryset = Category.objects.select_related("parent")
    pagination_class = None


class BrandListView(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = BrandSerializer
    queryset = Brand.objects.all()
    pagination_class = None

class VariantLookupView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        raw = request.query_params.get("ids", "")
        try:
            ids = [uuid.UUID(part) for part in raw.split(",") if part][:50]
        except ValueError:
            return Response({"detail": "Некорректные идентификаторы."}, status=400)
        qs = (
            ProductVariant.objects.filter(pk__in=ids, is_active=True, product__is_active=True)
            .select_related("product")
            .prefetch_related("product__images")
        )
        return Response(CartVariantSerializer(qs, many=True).data)


MAX_FAVORITES = 200


class FavoriteListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = selectors.favorite_products(request.user)[:100]
        return Response(ProductListSerializer(qs, many=True, context={"request": request}).data)

    def post(self, request):
        slug = request.data.get("slug")
        if not isinstance(slug, str) or not slug:
            return Response({"detail": "Укажите товар."}, status=400)
        product = get_object_or_404(Product, slug=slug, is_active=True)
        if (
            not Favorite.objects.filter(user=request.user, product=product).exists()
            and Favorite.objects.filter(user=request.user).count() >= MAX_FAVORITES
        ):
            return Response({"detail": "Слишком много товаров в избранном."}, status=400)
        _, created = Favorite.objects.get_or_create(user=request.user, product=product)
        return Response({"slug": slug}, status=201 if created else 200)


class FavoriteDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, slug):
        Favorite.objects.filter(user=request.user, product__slug=slug).delete()
        return Response(status=204)