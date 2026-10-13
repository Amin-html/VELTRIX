from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import AllowAny

from . import selectors
from .models import Brand, Category
from .serializers import (
    BrandSerializer, CategorySerializer, ProductDetailSerializer,
    ProductListSerializer, ProductQuerySerializer,
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