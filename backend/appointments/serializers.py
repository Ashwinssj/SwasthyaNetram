from rest_framework import serializers
from .models import Appointment
from employees.serializers import EmployeeSerializer
from patients.serializers import PatientSerializer

class AppointmentSerializer(serializers.ModelSerializer):
    doctor_details = EmployeeSerializer(source='doctor', read_only=True)
    patient_details = PatientSerializer(source='patient', read_only=True)

    class Meta:
        model = Appointment
        fields = '__all__'
