from django.urls import path

from .views import BrandListView, CategoryListView, ProductDetailView, ProductListView, VariantLookupView, FavoriteListCreateView, FavoriteDeleteView

urlpatterns = [
    path("catalog/products/", ProductListView.as_view()),
    path("catalog/products/<slug:slug>/", ProductDetailView.as_view()),
    path("catalog/categories/", CategoryListView.as_view()),
    path("catalog/brands/", BrandListView.as_view()),
    path("catalog/variants/", VariantLookupView.as_view()),
    path("catalog/favorites/", FavoriteListCreateView.as_view()),
    path("catalog/favorites/<slug:slug>/", FavoriteDeleteView.as_view()),
]