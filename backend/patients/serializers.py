from rest_framework import serializers
from .models import Patient, LabReport, SOAPNote, Prescription, Medicine

class LabReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = LabReport
        fields = '__all__'

class SOAPNoteSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='doctor.first_name', read_only=True)
    class Meta:
        model = SOAPNote
        fields = '__all__'

class MedicineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medicine
        fields = '__all__'

class PrescriptionSerializer(serializers.ModelSerializer):
    medicines = MedicineSerializer(many=True, read_only=True)
    class Meta:
        model = Prescription
        fields = '__all__'

class PatientSerializer(serializers.ModelSerializer):
    lab_reports = LabReportSerializer(many=True, read_only=True)
    soap_notes = SOAPNoteSerializer(many=True, read_only=True)
    prescriptions = PrescriptionSerializer(many=True, read_only=True)
    medicines = MedicineSerializer(many=True, read_only=True)
    room_assignment = serializers.SerializerMethodField()

    class Meta:
        model = Patient
        fields = '__all__'

    def get_room_assignment(self, obj):
        if hasattr(obj, 'occupied_room') and obj.occupied_room:
            return {
                'id': obj.occupied_room.id,
                'room_number': obj.occupied_room.room_number,
                'room_type': obj.occupied_room.room_type,
            }
        return None
