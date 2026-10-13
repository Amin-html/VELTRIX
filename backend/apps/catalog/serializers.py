from rest_framework import serializers

from .models import Brand, Category, Product, ProductImage, ProductVariant


class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ["id", "name", "slug"]


class CategorySerializer(serializers.ModelSerializer):
    parent = serializers.SlugRelatedField(slug_field="slug", read_only=True)

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "parent"]


class ImageSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ["url", "alt"]

    def get_url(self, obj):
        return obj.image.url


class VariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ["id", "sku", "title", "condition", "price", "currency", "stock", "warranty_months"]


class ProductListSerializer(serializers.ModelSerializer):
    brand = BrandSerializer()
    category = CategorySerializer()
    min_price = serializers.DecimalField(max_digits=12, decimal_places=2)
    in_stock = serializers.SerializerMethodField()
    cover = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ["id", "name", "slug", "brand", "category", "min_price", "in_stock", "cover"]

    def get_in_stock(self, obj):
        return (obj.total_stock or 0) > 0

    def get_cover(self, obj):
        images = list(obj.images.all())
        return images[0].image.url if images else None


class ProductDetailSerializer(serializers.ModelSerializer):
    brand = BrandSerializer()
    category = CategorySerializer()
    images = ImageSerializer(many=True)
    variants = VariantSerializer(source="active_variants", many=True)
    attributes = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ["id", "name", "slug", "description", "brand", "category",
                  "images", "variants", "attributes"]

    def get_attributes(self, obj):
        return [{"name": a.attribute.name, "value": a.value} for a in obj.attributes.all()]


class ProductQuerySerializer(serializers.Serializer):
    """Валидация query-параметров каталога."""

    category = serializers.SlugField(required=False)
    brand = serializers.SlugField(required=False)
    condition = serializers.ChoiceField(choices=ProductVariant.Condition.choices, required=False)
    price_min = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0, required=False)
    price_max = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0, required=False)
    q = serializers.CharField(max_length=100, required=False)
    ordering = serializers.ChoiceField(choices=["price", "-price", "newest", "name"], required=False)

class CartVariantSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name")
    product_slug = serializers.CharField(source="product.slug")
    cover = serializers.SerializerMethodField()

    class Meta:
        model = ProductVariant
        fields = ["id", "sku", "title", "condition", "price", "currency", "stock",
                  "product_name", "product_slug", "cover"]

    def get_cover(self, obj):
        images = list(obj.product.images.all())
        return images[0].image.url if images else None