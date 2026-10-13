from django.urls import path

from .views import BrandListView, CategoryListView, ProductDetailView, ProductListView

urlpatterns = [
    path("catalog/products/", ProductListView.as_view()),
    path("catalog/products/<slug:slug>/", ProductDetailView.as_view()),
    path("catalog/categories/", CategoryListView.as_view()),
    path("catalog/brands/", BrandListView.as_view()),
]