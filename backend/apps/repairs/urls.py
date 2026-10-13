from django.urls import path

from . import views

urlpatterns = [
    path("", views.RepairListCreateView.as_view()),
    path("master/", views.MasterRepairListView.as_view()),
    path("<uuid:pk>/", views.RepairDetailView.as_view()),
    path("<uuid:pk>/status/", views.RepairStatusView.as_view()),
    path("<uuid:pk>/quote/", views.RepairQuoteView.as_view()),
]