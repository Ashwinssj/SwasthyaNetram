from rest_framework import serializers
from .models import Patient, LabReport, SOAPNote

class LabReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = LabReport
        fields = '__all__'

class SOAPNoteSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='doctor.first_name', read_only=True)
    class Meta:
        model = SOAPNote
        fields = '__all__'

class PatientSerializer(serializers.ModelSerializer):
    lab_reports = LabReportSerializer(many=True, read_only=True)
    soap_notes = SOAPNoteSerializer(many=True, read_only=True)

    class Meta:
        model = Patient
        fields = '__all__'
