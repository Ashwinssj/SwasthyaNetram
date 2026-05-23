from django.db import models

class Hospital(models.Model):
    name = models.CharField(max_length=255)
    city = models.CharField(max_length=100, default='Unknown')
    address = models.TextField()
    contact_number = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Room(models.Model):
    ROOM_TYPE_CHOICES = [
        ('General Ward', 'General Ward'),
        ('Semi-Private', 'Semi-Private'),
        ('Private', 'Private'),
        ('ICU', 'ICU'),
    ]
    
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='rooms')
    room_number = models.CharField(max_length=50)
    room_type = models.CharField(max_length=50, choices=ROOM_TYPE_CHOICES, default='General Ward')
    current_patient = models.OneToOneField(
        'patients.Patient',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='occupied_room'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('hospital', 'room_number')

    def __str__(self):
        return f"{self.room_type} {self.room_number} at {self.hospital.name}"
