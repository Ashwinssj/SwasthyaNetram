from patients.models import Patient
from appointments.models import Appointment
from django.db.models import Q
import datetime

# --- Tool Functions ---

def search_patients(name_query: str):
    """
    Search for patients by name.
    Args:
        name_query: The name (or partial name) to search for.
    """
    patients = Patient.objects.filter(
        Q(first_name__icontains=name_query) | Q(last_name__icontains=name_query)
    )[:5]
    
    if not patients.exists():
        return "No patients found with that name."
        
    results = []
    for p in patients:
        results.append({
            "id": p.id,
            "name": f"{p.first_name} {p.last_name}",
            "medical_history": p.medical_history, 
            "phone": p.contact_number,
            "gender": p.gender
        })
    return results

def update_patient_medical_history(patient_id: int, new_history: str):
    """
    Update the medical history/diagnosis for a specific patient.
    Args:
        patient_id: The unique ID of the patient (get this from search_patients).
        new_history: The new medical history text to set.
    """
    try:
        patient = Patient.objects.get(id=patient_id)
        old_history = patient.medical_history
        patient.medical_history = new_history
        patient.save()
        return f"Successfully updated history for {patient.first_name} {patient.last_name}. Old: '{old_history}' -> New: '{new_history}'"
    except Patient.DoesNotExist:
        return f"Error: Patient with ID {patient_id} not found."
    except Exception as e:
        return f"Error updating patient: {str(e)}"

def get_upcoming_appointments(hospital_id: int):
    """
    Get list of upcoming appointments for the hospital.
    Args:
        hospital_id: The ID of the current hospital context.
    """
    today = datetime.date.today()
    appts = Appointment.objects.filter(
        hospital_id=hospital_id,
        appointment_date__gte=today
    ).order_by('appointment_date', 'appointment_time')[:5]
    
    if not appts.exists():
        return "No upcoming appointments found."

    results = []
    for a in appts:
        results.append(f"{a.appointment_date} {a.appointment_time}: {a.patient.first_name} with {a.doctor.last_name}")
    return results

# Map of available tools for the Agent
available_tools = {
    'search_patients': search_patients,
    'update_patient_medical_history': update_patient_medical_history,
    'get_upcoming_appointments': get_upcoming_appointments
}
