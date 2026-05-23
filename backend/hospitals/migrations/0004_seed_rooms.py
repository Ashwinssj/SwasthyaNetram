from django.db import migrations

def seed_default_rooms(apps, schema_editor):
    Hospital = apps.get_model('hospitals', 'Hospital')
    Room = apps.get_model('hospitals', 'Room')
    
    hospitals = Hospital.objects.all()
    
    default_rooms = [
        # ICU Beds
        ('ICU-101', 'ICU'),
        ('ICU-102', 'ICU'),
        # Private Rooms
        ('P-201', 'Private'),
        ('P-202', 'Private'),
        # Semi-Private Rooms
        ('SP-301-A', 'Semi-Private'),
        ('SP-301-B', 'Semi-Private'),
        # General Ward Beds
        ('GW-401-Bed1', 'General Ward'),
        ('GW-401-Bed2', 'General Ward'),
        ('GW-401-Bed3', 'General Ward'),
        ('GW-401-Bed4', 'General Ward'),
    ]
    
    for hospital in hospitals:
        for room_num, room_type in default_rooms:
            # Avoid duplicate creation
            if not Room.objects.filter(hospital=hospital, room_number=room_num).exists():
                Room.objects.create(
                    hospital=hospital,
                    room_number=room_num,
                    room_type=room_type,
                    current_patient=None
                )

def reverse_seed_rooms(apps, schema_editor):
    Room = apps.get_model('hospitals', 'Room')
    Room.objects.all().delete()

class Migration(migrations.Migration):

    dependencies = [
        ('hospitals', '0003_room'),
    ]

    operations = [
        migrations.RunPython(seed_default_rooms, reverse_seed_rooms),
    ]
