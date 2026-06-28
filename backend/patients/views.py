from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from .models import Patient, LabReport, SOAPNote, Prescription, Medicine
from .serializers import PatientSerializer, LabReportSerializer, SOAPNoteSerializer, PrescriptionSerializer, MedicineSerializer

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all().order_by('-created_at')
    serializer_class = PatientSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        hospital_id = self.request.query_params.get('hospital_id')
        if hospital_id:
            queryset = queryset.filter(hospital_id=hospital_id)
            
        unassigned_only = self.request.query_params.get('unassigned_only')
        if unassigned_only == 'true':
            queryset = queryset.filter(occupied_room__isnull=True)
            
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
            
        new_only = self.request.query_params.get('new_only')
        if new_only == 'true':
            queryset = queryset.filter(status='new')
            
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

class PrescriptionViewSet(viewsets.ModelViewSet):
    queryset = Prescription.objects.all().order_by('-uploaded_at')
    serializer_class = PrescriptionSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        patient_id = self.request.query_params.get('patient_id')
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        return queryset

    @action(detail=True, methods=['post'], url_path='retry-ocr')
    def retry_ocr(self, request, pk=None):
        """Re-trigger OCR extraction for a prescription that failed or is pending."""
        prescription = self.get_object()
        if prescription.ocr_status == 'completed' and prescription.extracted_text:
            return Response(
                {"detail": "OCR already completed successfully.", "ocr_status": "completed"},
                status=status.HTTP_200_OK
            )
        
        from .models import run_prescription_ocr
        from users.context import gemini_api_key_var
        import threading
        
        # Reset status
        Prescription.objects.filter(pk=prescription.pk).update(ocr_status='processing', ocr_error=None)
        
        # Capture API key context
        api_key = gemini_api_key_var.get()
        
        # Run in background thread
        thread = threading.Thread(target=run_prescription_ocr, args=(prescription.pk, api_key))
        thread.daemon = True
        thread.start()
        
        return Response(
            {"detail": "OCR re-triggered. Poll the status endpoint to check progress.", "ocr_status": "processing"},
            status=status.HTTP_202_ACCEPTED
        )

    @action(detail=True, methods=['get'], url_path='ocr-status')
    def ocr_status(self, request, pk=None):
        """Poll OCR processing status for a prescription."""
        prescription = self.get_object()
        serializer = self.get_serializer(prescription)
        return Response(serializer.data)

class MedicineViewSet(viewsets.ModelViewSet):
    queryset = Medicine.objects.all().order_by('-prescribed_at')
    serializer_class = MedicineSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        patient_id = self.request.query_params.get('patient_id')
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
            
        timing = self.request.query_params.get('timing')
        if timing:
            queryset = queryset.filter(timing=timing)
        return queryset

