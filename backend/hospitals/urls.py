from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import HospitalViewSet, RoomViewSet

router = DefaultRouter()
router.register(r'hospitals', HospitalViewSet)
router.register(r'rooms', RoomViewSet, basename='rooms')

from .stats_views import DashboardStatsView

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
]
