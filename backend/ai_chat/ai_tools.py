from patients.models import Patient
from appointments.models import Appointment
from .rag_utils import semantic_search_patients
from django.db.models import Q
import datetime

# --- Tool Functions ---

def analyze_patient_records(query: str, hospital_id: int):
    """
    Use this tool to semantically search and analyze patient records based on a descriptive query.
    Examples: "Find patients with back pain", "Who are the diabetic patients?", "What are John's symptoms?"
    Args:
        query: The detailed medical or descriptive query to search for.
        hospital_id: The ID of the hospital to search in.
    """
    print(f"RAG Search Query: {query}")
    results = semantic_search_patients(query, hospital_id, limit=3)
    
    if not results:
        return f"No relevant patients found for the query: '{query}'."
        
    output = []
    output.append(f"Found {len(results)} relevant patients:")
    for i, res in enumerate(results):
        score = res['score']
        text = res['text']
        output.append(f"\n--- Patient {i+1} (Relevance Score: {score:.2f}) ---")
        output.append(text)
        
    return "\n".join(output)

def search_patients(name_query: str, hospital_id: int):
    """
    Search for patients by exact or partial name within a specific hospital. 
    Use analyze_patient_records if searching by symptoms or history.
    Args:
        name_query: The name (or partial name) to search for.
        hospital_id: The ID of the hospital to search in.
    """
    query = Q(first_name__icontains=name_query) | Q(last_name__icontains=name_query)
    if hospital_id:
        query &= Q(hospital_id=hospital_id)
        
    patients = Patient.objects.filter(query)[:5]
    
    if not patients.exists():
        return "No patients found with that name in this hospital."
        
    results = []
    for p in patients:
        lab_reports = [r.title for r in p.lab_reports.all()]
        soap_notes = [f"{n.created_at.date()} (Dr. {n.doctor.last_name if n.doctor else 'Unknown'}): {n.assessment}" for n in p.soap_notes.all()]
        
        results.append({
            "id": p.id,
            "name": f"{p.first_name} {p.last_name}",
            "medical_history": p.medical_history, 
            "phone": p.contact_number,
            "gender": p.gender,
            "lab_reports": lab_reports,
            "soap_notes": soap_notes
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
    'analyze_patient_records': analyze_patient_records,
    'update_patient_medical_history': update_patient_medical_history,
    'get_upcoming_appointments': get_upcoming_appointments
}
