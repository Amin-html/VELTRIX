from django.urls import path

from . import views

urlpatterns = [
    path("", views.OrderListCreateView.as_view()),
    path("<uuid:pk>/", views.OrderDetailView.as_view()),
    path("<uuid:pk>/cancel/", views.OrderCancelView.as_view()),
]