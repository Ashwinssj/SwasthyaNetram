from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PatientViewSet, LabReportViewSet, SOAPNoteViewSet

router = DefaultRouter()
router.register(r'reports', LabReportViewSet) # /api/patients/reports/
router.register(r'notes', SOAPNoteViewSet)    # /api/patients/notes/
router.register(r'', PatientViewSet)          # /api/patients/

urlpatterns = [
    path('', include(router.urls)),
]
