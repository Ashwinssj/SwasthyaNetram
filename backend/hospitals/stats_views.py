from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Hospital, Room
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

        # Dynamic room occupancy calculation
        if hospital_id:
            total_rooms = Room.objects.filter(hospital_id=hospital_id).count()
            occupied_rooms = Room.objects.filter(hospital_id=hospital_id, current_patient__isnull=False).count()
        else:
            total_rooms = Room.objects.count()
            occupied_rooms = Room.objects.filter(current_patient__isnull=False).count()

        available_rooms = total_rooms - occupied_rooms

        if total_rooms > 0:
            occupancy_percent = int((occupied_rooms / total_rooms) * 100)
            room_occupancy = f"{occupancy_percent}%"
        else:
            room_occupancy = "0%"

        return Response({
            'total_patients': patients_count,
            'total_employees': employees_count,
            'total_doctors': doctors_count,
            'operations': 8, 
            'room_occupancy': room_occupancy,
            'total_rooms': total_rooms,
            'occupied_rooms': occupied_rooms,
            'available_rooms': available_rooms,
            'chart_data': formatted_chart_data,
            'upcoming_schedule': upcoming_schedule
        })
