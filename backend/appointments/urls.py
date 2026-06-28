from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AppointmentViewSet, DoctorTimeslotViewSet

router = DefaultRouter()
router.register(r'timeslots', DoctorTimeslotViewSet)
router.register(r'', AppointmentViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
