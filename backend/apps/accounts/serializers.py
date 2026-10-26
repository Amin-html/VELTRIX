import re

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from .models import Address, User

USERNAME_RE = re.compile(r"^[a-z0-9_]{3,30}$")
RESERVED_USERNAMES = {
    "admin", "administrator", "support", "veltrix", "master", "api", "www", "root", "me", "help",
}


class UserSerializer(serializers.ModelSerializer):
    username = serializers.CharField(max_length=30, required=False, allow_blank=True, allow_null=True)
    avatar_url = serializers.SerializerMethodField()
    cover_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "email", "first_name", "phone", "role", "email_verified",
            "username", "bio", "city", "avatar_url", "cover_url", "date_joined",
        ]
        read_only_fields = ["id", "email", "role", "email_verified", "date_joined"]

    def get_avatar_url(self, obj):
        return obj.avatar.url if obj.avatar else None

    def get_cover_url(self, obj):
        return obj.cover.url if obj.cover else None

    def validate_username(self, value):
        if value is None or not value.strip():
            return None
        value = value.strip().lower()
        if not USERNAME_RE.match(value):
            raise serializers.ValidationError("От 3 до 30 символов: латинские буквы, цифры и _.")
        if value in RESERVED_USERNAMES:
            raise serializers.ValidationError("Это имя недоступно.")
        taken = User.objects.filter(username=value)
        if self.instance is not None:
            taken = taken.exclude(pk=self.instance.pk)
        if taken.exists():
            raise serializers.ValidationError("Это имя уже занято.")
        return value


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=254)
    password = serializers.CharField(write_only=True, max_length=128, trim_whitespace=False)
    first_name = serializers.CharField(max_length=80, required=False, allow_blank=True)

    def validate_email(self, value):
        return value.strip().lower()

    def validate(self, attrs):
        try:
            validate_password(attrs["password"])
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"password": list(exc.messages)})
        return attrs


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=254)
    password = serializers.CharField(write_only=True, max_length=128, trim_whitespace=False)


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=254)


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField(max_length=64)
    token = serializers.CharField(max_length=128)
    password = serializers.CharField(write_only=True, max_length=128, trim_whitespace=False)


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ["id", "label", "address"]
        read_only_fields = ["id"]