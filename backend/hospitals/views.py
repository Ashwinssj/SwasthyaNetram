from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Hospital, Room
from .serializers import HospitalSerializer, RoomSerializer

class HospitalViewSet(viewsets.ModelViewSet):
    queryset = Hospital.objects.all()
    serializer_class = HospitalSerializer

class RoomViewSet(viewsets.ModelViewSet):
    serializer_class = RoomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Room.objects.all().order_by('room_number')
        hospital_id = self.request.query_params.get('hospital_id')
        if hospital_id:
            queryset = queryset.filter(hospital_id=hospital_id)
        return queryset

    def create(self, request, *args, **kwargs):
        hospital_id = request.data.get('hospital')
        room_number = request.data.get('room_number')
        room_type = request.data.get('room_type', 'General Ward')
        bed_count = request.data.get('bed_count', 1)
        
        try:
            bed_count = int(bed_count)
        except (ValueError, TypeError):
            bed_count = 1

        if not hospital_id or not room_number:
            return Response({'error': 'hospital and room_number are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            hospital = Hospital.objects.get(id=hospital_id)
        except Hospital.DoesNotExist:
            return Response({'error': 'Hospital not found'}, status=status.HTTP_404_NOT_FOUND)

        if bed_count > 1:
            # Bulk Creation
            created_rooms = []
            for i in range(1, bed_count + 1):
                composed_number = f"{room_number}-Bed{i}"
                if not Room.objects.filter(hospital=hospital, room_number=composed_number).exists():
                    room = Room.objects.create(
                        hospital=hospital,
                        room_number=composed_number,
                        room_type=room_type,
                        current_patient=None
                    )
                    created_rooms.append(room)
            
            serializer = RoomSerializer(created_rooms, many=True)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            # Single Creation
            if Room.objects.filter(hospital=hospital, room_number=room_number).exists():
                return Response({'error': f'Room/Bed with identifier "{room_number}" already exists.'}, status=status.HTTP_400_BAD_REQUEST)
                
            room = Room.objects.create(
                hospital=hospital,
                room_number=room_number,
                room_type=room_type,
                current_patient=None
            )
            serializer = RoomSerializer(room)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def assign_patient(self, request, pk=None):
        room = self.get_object()
        patient_id = request.data.get('patient_id')
        if not patient_id:
            return Response({'error': 'patient_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        from patients.models import Patient
        try:
            patient = Patient.objects.get(id=patient_id)
        except Patient.DoesNotExist:
            return Response({'error': 'Patient not found'}, status=status.HTTP_404_NOT_FOUND)

        # Safety Check: if the patient is already assigned to ANOTHER room, release them first
        existing_room = Room.objects.filter(current_patient=patient).exclude(id=room.id).first()
        if existing_room:
            existing_room.current_patient = None
            existing_room.save()

        # Assign to this room
        room.current_patient = patient
        room.save()
        return Response(RoomSerializer(room).data)

    @action(detail=True, methods=['post'])
    def release_patient(self, request, pk=None):
        room = self.get_object()
        room.current_patient = None
        room.save()
        return Response(RoomSerializer(room).data)
