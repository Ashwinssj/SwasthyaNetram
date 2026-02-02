from rest_framework import viewsets
from .models import Patient, LabReport, SOAPNote
from .serializers import PatientSerializer, LabReportSerializer, SOAPNoteSerializer

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all().order_by('-created_at')
    serializer_class = PatientSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        hospital_id = self.request.query_params.get('hospital_id')
        if hospital_id:
            queryset = queryset.filter(hospital_id=hospital_id)
        return queryset

class LabReportViewSet(viewsets.ModelViewSet):
    queryset = LabReport.objects.all().order_by('-uploaded_at')
    serializer_class = LabReportSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Filter by patient's hospital implicitly or explicit query param
        patient_id = self.request.query_params.get('patient_id')
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        return queryset

class SOAPNoteViewSet(viewsets.ModelViewSet):
    queryset = SOAPNote.objects.all().order_by('-created_at')
    serializer_class = SOAPNoteSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        patient_id = self.request.query_params.get('patient_id')
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        return queryset

    def perform_create(self, serializer):
        # Auto-assign doctor if user is an employee
        # Note: This requires the logged-in user to be linked to an Employee record
        # For now, we'll leave it optional or handle standard user
        serializer.save()
