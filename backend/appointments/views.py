from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
import datetime
from .models import Appointment, DoctorTimeslot
from .serializers import AppointmentSerializer, DoctorTimeslotSerializer

class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        hospital_id = self.request.query_params.get('hospital_id')
        if hospital_id:
            queryset = queryset.filter(hospital_id=hospital_id)
        return queryset

    @action(detail=False, methods=['get'], url_path='available_slots')
    def available_slots(self, request):
        doctor_id = request.query_params.get('doctor_id')
        date_str = request.query_params.get('date')

        if not doctor_id or not date_str:
            return Response(
                {"error": "doctor_id and date query parameters are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            dt = datetime.datetime.strptime(date_str.strip(), "%Y-%m-%d")
            day_of_week = dt.strftime("%A").upper()
        except ValueError:
            return Response(
                {"error": "Invalid date format. Use YYYY-MM-DD."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get all active timeslots for this doctor on this day of the week
        timeslots = DoctorTimeslot.objects.filter(
            doctor_id=doctor_id,
            day_of_week=day_of_week,
            is_active=True
        )

        # Get all active appointments booked for this doctor on this date
        booked_appointments = Appointment.objects.filter(
            doctor_id=doctor_id,
            appointment_date=dt.date(),
            status='SCHEDULED'
        )
        
        # Standardize matching by comparing time strings in HH:MM format
        booked_times = {app.appointment_time.strftime("%H:%M") for app in booked_appointments}

        results = []
        for slot in timeslots:
            slot_time_str = slot.start_time.strftime("%H:%M")
            slot_end_time_str = slot.end_time.strftime("%H:%M")
            is_booked = slot_time_str in booked_times
            
            results.append({
                "id": slot.id,
                "start_time": slot_time_str,
                "end_time": slot_end_time_str,
                "is_booked": is_booked
            })

        return Response(results)


class DoctorTimeslotViewSet(viewsets.ModelViewSet):
    queryset = DoctorTimeslot.objects.all()
    serializer_class = DoctorTimeslotSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        doctor_id = self.request.query_params.get('doctor_id')
        if doctor_id:
            queryset = queryset.filter(doctor_id=doctor_id)
        return queryset
