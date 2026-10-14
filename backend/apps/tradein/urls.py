from django.urls import path

from . import views

urlpatterns = [
    path("", views.TradeInListCreateView.as_view()),
    path("<uuid:pk>/", views.TradeInDetailView.as_view()),
    path("<uuid:pk>/respond/", views.TradeInRespondView.as_view()),
]