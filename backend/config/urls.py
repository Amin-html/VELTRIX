from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from django.db import connection
from django.http import JsonResponse


def health(_request):
    try:
        connection.ensure_connection()
    except Exception:
        return JsonResponse({"status": "error"}, status=503)
    return JsonResponse({"status": "ok"})

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include("apps.catalog.urls")),
    path("api/v1/auth/", include("apps.accounts.urls")),
    path("api/v1/repairs/", include("apps.repairs.urls")),
    path("api/v1/orders/", include("apps.orders.urls")),
    path("api/v1/trade-ins/", include("apps.tradein.urls")),
    path("api/v1/health/", health),
]

if settings.DEBUG:



    
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)