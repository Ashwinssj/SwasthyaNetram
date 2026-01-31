from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Hospital
from patients.models import Patient
from employees.models import Employee

from django.db.models.functions import TruncMonth
from django.db.models import Count

from appointments.models import Appointment
from appointments.serializers import AppointmentSerializer
from django.utils import timezone

class DashboardStatsView(APIView):
    def get(self, request):
        hospital_id = request.query_params.get('hospital_id')
        
        if hospital_id:
            patients_queryset = Patient.objects.filter(hospital_id=hospital_id)
            employees_count = Employee.objects.filter(hospital_id=hospital_id).count()
            doctors_count = Employee.objects.filter(hospital_id=hospital_id, role='DOCTOR').count()
            appointments_queryset = Appointment.objects.filter(hospital_id=hospital_id, appointment_date__gte=timezone.now().date(), status='SCHEDULED').order_by('appointment_date', 'appointment_time')[:4]
        else:
            patients_queryset = Patient.objects.all()
            employees_count = Employee.objects.count()
            doctors_count = Employee.objects.filter(role='DOCTOR').count()
            appointments_queryset = Appointment.objects.filter(appointment_date__gte=timezone.now().date(), status='SCHEDULED').order_by('appointment_date', 'appointment_time')[:4]

        patients_count = patients_queryset.count()

        # Aggregate patients by month
        chart_data = (
            patients_queryset
            .annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(patients=Count('id'))
            .order_by('month')
        )

        formatted_chart_data = [
            {
                "name": entry['month'].strftime('%b'),
                "patients": entry['patients']
            }
            for entry in chart_data
        ]
        
        upcoming_schedule = AppointmentSerializer(appointments_queryset, many=True).data

        return Response({
            'total_patients': patients_count,
            'total_employees': employees_count,
            'total_doctors': doctors_count,
            'operations': 8, 
            'room_occupancy': "85%",
            'chart_data': formatted_chart_data,
            'upcoming_schedule': upcoming_schedule
        })
