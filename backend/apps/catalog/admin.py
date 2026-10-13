from django.contrib import admin

from .models import (
    Attribute, Brand, Category, Product, ProductAttributeValue,
    ProductImage, ProductVariant,
)


class VariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 1


class ImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


class AttributeInline(admin.TabularInline):
    model = ProductAttributeValue
    extra = 1


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "brand", "category", "is_active")
    list_filter = ("is_active", "brand", "category")
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}
    inlines = [VariantInline, ImageInline, AttributeInline]


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    prepopulated_fields = {"slug": ("name",)}


admin.site.register(Attribute, admin.ModelAdmin)