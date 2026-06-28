from patients.models import Patient
from appointments.models import Appointment
from employees.models import Employee
from .rag_utils import semantic_search_patients
from django.db.models import Q
import datetime
from langchain_core.tools import tool

# --- Tool Functions ---

@tool
def analyze_patient_records(query: str, hospital_id: int = None):
    """
    Use this tool to semantically search and analyze patient records based on a descriptive query.
    Examples: "Find patients with back pain", "Who are the diabetic patients?", "What are John's symptoms?"
    Args:
        query: The detailed medical or descriptive query to search for.
        hospital_id: The ID of the hospital to search in. (Optional)
    """
    if hospital_id is not None:
        try:
            hospital_id = int(hospital_id)
        except (ValueError, TypeError):
            hospital_id = None

    if hospital_id is None:
        from hospitals.models import Hospital
        h = Hospital.objects.first()
        hospital_id = h.id if h else 1

    print(f"RAG Search Query: {query} for hospital_id: {hospital_id}")
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

@tool
def search_patients(name_query: str, hospital_id: int = None):
    """
    Search for patients by exact/partial name or numeric Patient ID within a specific hospital. 
    Use analyze_patient_records if searching by symptoms or history.
    Args:
        name_query: The name, partial name, or numeric ID of the patient to search for.
        hospital_id: The ID of the hospital to search in. (Optional)
    """
    if hospital_id is not None:
        try:
            hospital_id = int(hospital_id)
        except (ValueError, TypeError):
            hospital_id = None

    if hospital_id is None:
        from hospitals.models import Hospital
        h = Hospital.objects.first()
        hospital_id = h.id if h else 1

    # Check if the query is a numeric ID
    try:
        patient_id = int(name_query.strip())
        query = Q(id=patient_id)
    except ValueError:
        query = Q(first_name__icontains=name_query) | Q(last_name__icontains=name_query)

    if hospital_id:
        query &= Q(hospital_id=hospital_id)
        
    patients = Patient.objects.filter(query)[:5]
    
    if not patients.exists():
        return f"No patients found matching '{name_query}' in this hospital."
        
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

@tool
def update_patient_medical_history(patient_id: int, new_history: str):
    """
    Update the medical history/diagnosis for a specific patient.
    Args:
        patient_id: The unique ID of the patient (get this from search_patients).
        new_history: The new medical history text to set.
    """
    try:
        patient_id = int(patient_id)
    except (ValueError, TypeError):
        return f"Error: Invalid patient ID '{patient_id}'."

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

@tool
def get_upcoming_appointments(hospital_id: int = None):
    """
    Get list of upcoming appointments for the hospital.
    Args:
        hospital_id: The ID of the current hospital context. (Optional)
    """
    if hospital_id is not None:
        try:
            hospital_id = int(hospital_id)
        except (ValueError, TypeError):
            hospital_id = None

    if hospital_id is None:
        from hospitals.models import Hospital
        h = Hospital.objects.first()
        hospital_id = h.id if h else 1

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

@tool
def create_patient(
    first_name: str,
    last_name: str,
    date_of_birth: str,
    gender: str,
    contact_number: str,
    address: str,
    hospital_id: int = None,
    symptoms: str = "",
    medical_history: str = ""
):
    """
    Create a new patient record in the database.
    Args:
        first_name: First name of the patient.
        last_name: Last name of the patient.
        date_of_birth: Date of birth (YYYY-MM-DD format).
        gender: Gender ('M' for Male, 'F' for Female, 'O' for Other).
        contact_number: Contact number.
        address: Complete address.
        hospital_id: The ID of the hospital where the patient is being registered. (Optional)
        symptoms: Initial symptoms or reason for visit. (Optional)
        medical_history: Past medical history. (Optional)
    """
    import datetime
    try:
        dob = datetime.datetime.strptime(date_of_birth.strip(), "%Y-%m-%d").date()
    except ValueError:
        return "Error: date_of_birth must be in YYYY-MM-DD format."

    gender_val = gender.strip().upper()
    if gender_val.startswith('M'):
        gender = 'M'
    elif gender_val.startswith('F'):
        gender = 'F'
    else:
        gender = 'O'

    if hospital_id is not None:
        try:
            hospital_id = int(hospital_id)
        except (ValueError, TypeError):
            hospital_id = None

    if hospital_id is None:
        from hospitals.models import Hospital
        h = Hospital.objects.first()
        hospital_id = h.id if h else 1

    try:
        patient = Patient.objects.create(
            hospital_id=hospital_id,
            first_name=first_name.strip(),
            last_name=last_name.strip(),
            date_of_birth=dob,
            gender=gender,
            contact_number=contact_number.strip(),
            address=address.strip(),
            symptoms=symptoms.strip() if symptoms else "",
            medical_history=medical_history.strip() if medical_history else ""
        )
        return f"Successfully created patient: {patient.first_name} {patient.last_name} (ID: {patient.id}) in hospital ID {hospital_id}."
    except Exception as e:
        return f"Error creating patient: {str(e)}"

@tool
def search_doctors(name_query: str = "", hospital_id: int = None):
    """
    Search for doctors by name or list all available doctors in a hospital.
    Args:
        name_query: Partial or full name of the doctor to search for. (Optional)
        hospital_id: The ID of the hospital to filter by. (Optional)
    """
    query = Q(role='DOCTOR', is_active=True)
    
    if hospital_id is not None:
        try:
            query &= Q(hospital_id=int(hospital_id))
        except (ValueError, TypeError):
            pass
            
    if name_query:
        query &= (Q(first_name__icontains=name_query.strip()) | Q(last_name__icontains=name_query.strip()))
        
    doctors = Employee.objects.filter(query)[:10]
    
    if not doctors.exists():
        return f"No active doctors found matching '{name_query}'."
        
    results = []
    for d in doctors:
        results.append({
            "id": d.id,
            "name": f"Dr. {d.first_name} {d.last_name}",
            "email": d.email,
            "phone": d.contact_number,
            "hospital_id": d.hospital_id
        })
    return results

@tool
def book_appointment(
    patient_id: int,
    doctor_id: int,
    appointment_date: str,
    appointment_time: str,
    reason: str = "",
    hospital_id: int = None
):
    """
    Book a new appointment with a doctor for a patient.
    Args:
        patient_id: The unique ID of the patient.
        doctor_id: The unique ID of the doctor (Employee).
        appointment_date: Date of appointment (YYYY-MM-DD format).
        appointment_time: Time of appointment (HH:MM or HH:MM AM/PM format, e.g. "10:30", "14:15", "02:30 PM").
        reason: Reason for booking the appointment. (Optional)
        hospital_id: The ID of the hospital context. (Optional)
    """
    import datetime
    try:
        patient_id = int(patient_id)
        doctor_id = int(doctor_id)
    except (ValueError, TypeError):
        return "Error: patient_id and doctor_id must be integers."

    try:
        patient = Patient.objects.get(id=patient_id)
    except Patient.DoesNotExist:
        return f"Error: Patient with ID {patient_id} does not exist."

    try:
        doctor = Employee.objects.get(id=doctor_id, role='DOCTOR')
    except Employee.DoesNotExist:
        if Employee.objects.filter(id=doctor_id).exists():
            return f"Error: Employee with ID {doctor_id} is not registered as a DOCTOR."
        return f"Error: Doctor with ID {doctor_id} does not exist."

    # Parse date
    try:
        appt_date = datetime.datetime.strptime(appointment_date.strip(), "%Y-%m-%d").date()
    except ValueError:
        return "Error: appointment_date must be in YYYY-MM-DD format."

    # Parse time
    appt_time = None
    time_formats = ["%H:%M", "%H:%M:%S", "%I:%M %p", "%I:%M%p"]
    for fmt in time_formats:
        try:
            appt_time = datetime.datetime.strptime(appointment_time.strip(), fmt).time()
            break
        except ValueError:
            continue

    if not appt_time:
        return f"Error: Unable to parse appointment_time '{appointment_time}'. Supported formats: HH:MM (24h) or HH:MM AM/PM."

    if hospital_id is not None:
        try:
            hospital_id = int(hospital_id)
        except (ValueError, TypeError):
            hospital_id = None

    if hospital_id is None:
        hospital_id = patient.hospital_id or doctor.hospital_id

    try:
        from appointments.models import Appointment
        appointment = Appointment.objects.create(
            hospital_id=hospital_id,
            patient=patient,
            doctor=doctor,
            appointment_date=appt_date,
            appointment_time=appt_time,
            reason=reason.strip() if reason else "",
            status='SCHEDULED'
        )
        return f"Successfully booked appointment (ID: {appointment.id}) for {patient.first_name} {patient.last_name} with Dr. {doctor.first_name} {doctor.last_name} on {appointment_date} at {appointment_time}."
    except Exception as e:
        return f"Error booking appointment: {str(e)}"

# Map of available tools for the Agent
available_tools = {
    'search_patients': search_patients,
    'analyze_patient_records': analyze_patient_records,
    'update_patient_medical_history': update_patient_medical_history,
    'get_upcoming_appointments': get_upcoming_appointments,
    'create_patient': create_patient,
    'search_doctors': search_doctors,
    'book_appointment': book_appointment
}
