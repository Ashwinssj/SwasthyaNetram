from rest_framework import serializers
from .models import Hospital, Room
from patients.models import Patient

class HospitalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hospital
        fields = '__all__'

class PatientMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = ['id', 'first_name', 'last_name', 'contact_number']

class RoomSerializer(serializers.ModelSerializer):
    patient_details = PatientMinimalSerializer(source='current_patient', read_only=True)
    
    class Meta:
        model = Room
        fields = ['id', 'hospital', 'room_number', 'room_type', 'current_patient', 'patient_details', 'created_at']
