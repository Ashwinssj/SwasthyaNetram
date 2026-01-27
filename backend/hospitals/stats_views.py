from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Hospital
from patients.models import Patient
from employees.models import Employee

class DashboardStatsView(APIView):
    def get(self, request):
        hospital_id = request.query_params.get('hospital_id')
        
        if hospital_id:
            patients_count = Patient.objects.filter(hospital_id=hospital_id).count()
            employees_count = Employee.objects.filter(hospital_id=hospital_id).count()
            doctors_count = Employee.objects.filter(hospital_id=hospital_id, role='DOCTOR').count()
        else:
            patients_count = Patient.objects.count()
            employees_count = Employee.objects.count()
            doctors_count = Employee.objects.filter(role='DOCTOR').count()

        return Response({
            'total_patients': patients_count,
            'total_employees': employees_count,
            'total_doctors': doctors_count,
            # Mock data for now where real data isn't available
            'operations': 8, 
            'room_occupancy': "85%"
        })
