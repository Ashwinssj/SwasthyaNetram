from django.db import models
from hospitals.models import Hospital

class Patient(models.Model):
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
    ]
    
    BLOOD_GROUP_CHOICES = [
        ('A+', 'A+'),
        ('A-', 'A-'),
        ('B+', 'B+'),
        ('B-', 'B-'),
        ('AB+', 'AB+'),
        ('AB-', 'AB-'),
        ('O+', 'O+'),
        ('O-', 'O-'),
    ]
    
    STATUS_CHOICES = [
        ('new', 'New'),
        ('active', 'Active'),
    ]

    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='patients', null=True, blank=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    blood_group = models.CharField(max_length=5, choices=BLOOD_GROUP_CHOICES, blank=True, null=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='new')
    allergies = models.TextField(blank=True, null=True, help_text="List of patient food/drug allergies")
    contact_number = models.CharField(max_length=15)
    address = models.TextField()
    symptoms = models.TextField(blank=True, null=True)
    medical_history = models.TextField(blank=True, null=True)
    embedding_json = models.TextField(blank=True, null=True, help_text="Stores the JSON representation of the patient vector embedding")
    breakfast_time = models.CharField(max_length=20, default='08:30 AM')
    lunch_time = models.CharField(max_length=20, default='01:30 PM')
    dinner_time = models.CharField(max_length=20, default='08:30 PM')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

class LabReport(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='lab_reports')
    title = models.CharField(max_length=200)
    file = models.FileField(upload_to='lab_reports/', blank=True, null=True)
    extracted_text = models.TextField(blank=True, null=True, help_text="Auto-extracted text for AI search")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        
        if self.file and self.file.name:
            import os
            try:
                with self.file.open('rb') as f:
                    ext = os.path.splitext(self.file.name)[1].lower()
                    text = None
                    if ext == '.pdf':
                        try:
                            from pypdf import PdfReader
                            reader = PdfReader(f)
                            text = "\n".join([page.extract_text() or "" for page in reader.pages])
                        except ImportError:
                            pass
                    elif ext in ['.txt', '.csv']:
                        text = f.read().decode('utf-8', errors='ignore')

                    if text is not None and text != self.extracted_text:
                        self.extracted_text = text[:15000]  # Limit to 15k chars for embedding
                        LabReport.objects.filter(pk=self.pk).update(extracted_text=self.extracted_text)
                        
                        # Invalidate Patient embedding so it regenerates with this new document
                        self.patient.embedding_json = None
                        self.patient.save(update_fields=['embedding_json'])
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(f"Error extracting text from LabReport: {e}")

    def __str__(self):
        return f"{self.title} for {self.patient}"

class SOAPNote(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='soap_notes')
    doctor = models.ForeignKey('employees.Employee', on_delete=models.SET_NULL, null=True, related_name='authored_soap_notes')
    subjective = models.TextField()
    objective = models.TextField()
    assessment = models.TextField()
    plan = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"SOAP Note for {self.patient} on {self.created_at.date()}"

class Prescription(models.Model):
    OCR_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='prescriptions')
    image = models.ImageField(upload_to='prescriptions/')
    extracted_text = models.TextField(blank=True, null=True, help_text="Raw OCR text representation")
    ocr_status = models.CharField(max_length=20, choices=OCR_STATUS_CHOICES, default='pending')
    ocr_error = models.TextField(blank=True, null=True, help_text="Error message if OCR failed")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Prescription for {self.patient} on {self.uploaded_at.date()}"

class Medicine(models.Model):
    TIMING_CHOICES = [
        ('morning', 'morning'),
        ('afternoon', 'afternoon'),
        ('night', 'night'),
        ('any', 'any'),
    ]

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='medicines')
    prescription = models.ForeignKey(Prescription, on_delete=models.CASCADE, null=True, blank=True, related_name='medicines')
    name = models.CharField(max_length=200)
    dosage = models.CharField(max_length=100)        # e.g., "500mg" or "1 tablet"
    frequency = models.CharField(max_length=100)     # e.g., "Twice a day"
    duration = models.CharField(max_length=100)      # e.g., "7 days"
    timing = models.CharField(max_length=20, choices=TIMING_CHOICES, default='any')
    instructions = models.TextField(blank=True, null=True)  # e.g., "Take after food"
    prescribed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.dosage}) for {self.patient}"

from django.db.models.signals import post_save
from django.dispatch import receiver
import json
import logging
import os
import time

logger = logging.getLogger(__name__)

def run_prescription_ocr(prescription_id):
    """
    Core OCR extraction logic using the new google.genai SDK.
    Includes retry with exponential backoff for rate-limit (429) errors.
    Returns (success: bool, error_message: str | None).
    """
    from .models import Prescription, Medicine
    
    try:
        instance = Prescription.objects.get(pk=prescription_id)
    except Prescription.DoesNotExist:
        return False, "Prescription not found."

    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        Prescription.objects.filter(pk=prescription_id).update(
            ocr_status='failed',
            ocr_error='No GEMINI_API_KEY configured in server environment.'
        )
        return False, "No GEMINI_API_KEY configured."

    # Mark as processing
    Prescription.objects.filter(pk=prescription_id).update(ocr_status='processing', ocr_error=None)

    try:
        from google import genai
        from google.genai import types
        from PIL import Image
        import io

        client = genai.Client(api_key=api_key)

        # Read the image bytes from the FileField
        with instance.image.open('rb') as f:
            image_bytes = f.read()

        # Detect mime type
        img_pil = Image.open(io.BytesIO(image_bytes))
        fmt = img_pil.format or 'PNG'
        mime_map = {'PNG': 'image/png', 'JPEG': 'image/jpeg', 'JPG': 'image/jpeg', 'WEBP': 'image/webp', 'GIF': 'image/gif'}
        mime_type = mime_map.get(fmt.upper(), 'image/png')

        prompt = (
            "You are an expert clinical pharmacist. Analyze this medical prescription image carefully.\n"
            "Extract the list of prescribed medicines in a highly structured JSON format.\n"
            "You MUST return ONLY a valid, parseable JSON array of objects. Do not include any markdown backticks (like ```json) or commentary.\n"
            "Each object in the array must contain these exact keys:\n"
            "- 'name': The name of the medicine (string)\n"
            "- 'dosage': The dosage, e.g. '500mg', '1 tablet' (string)\n"
            "- 'frequency': How often to take, e.g. 'Twice a day', '1-0-1' (string)\n"
            "- 'duration': Duration to take, e.g. '7 days', '2 weeks' (string)\n"
            "- 'timing': Specific timing category (must choose EXACTLY one from: 'morning', 'afternoon', 'night', 'any') (string)\n"
            "- 'instructions': Specific meal instructions, explicitly stating whether the medicine is to be taken 'Before meals' or 'After meals' (string, required)\n\n"
            "Example response:\n"
            "[\n"
            "  {\n"
            "    \"name\": \"Amoxicillin\",\n"
            "    \"dosage\": \"500mg\",\n"
            "    \"frequency\": \"Three times a day\",\n"
            "    \"duration\": \"5 days\",\n"
            "    \"timing\": \"morning\",\n"
            "    \"instructions\": \"After meals\"\n"
            "  }\n"
            "]"
        )

        image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)

        # Model fallback chain with retry for rate-limit/server errors
        model_chain = ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash']
        response = None
        last_error = None

        for model_name in model_chain:
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    logger.info(f"Attempting OCR with model={model_name}, attempt={attempt+1}")
                    response = client.models.generate_content(
                        model=model_name,
                        contents=[prompt, image_part],
                        config=types.GenerateContentConfig(
                            thinking_config=types.ThinkingConfig(
                                thinking_budget=0
                            )
                        )
                    )
                    last_error = None
                    break  # Success
                except Exception as e:
                    last_error = e
                    err_str = str(e).lower()
                    if "429" in err_str or "quota" in err_str or "rate" in err_str or "resource" in err_str or "503" in err_str or "unavailable" in err_str or "overloaded" in err_str:
                        wait_time = (2 ** attempt) * 2  # 2s, 4s, 8s
                        logger.warning(f"Temporary error on {model_name} (attempt {attempt+1}): {e}, retrying in {wait_time}s...")
                        time.sleep(wait_time)
                        continue
                    elif "404" in err_str or "not found" in err_str or "not supported" in err_str:
                        logger.warning(f"Model {model_name} not available, trying next fallback...")
                        break  # Try next model
                    else:
                        logger.error(f"Unexpected error with {model_name}: {e}")
                        break  # Try next model

            if response is not None:
                break

        if response is None:
            error_msg = f"All AI models failed. Last error: {last_error}"
            logger.error(error_msg)
            Prescription.objects.filter(pk=prescription_id).update(
                ocr_status='failed',
                ocr_error=error_msg[:500]
            )
            return False, error_msg

        response_text = response.text.strip()

        # Clean markdown JSON block formatting if present
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        elif response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()

        # Parse the JSON
        medicines_data = json.loads(response_text)

        # Save the extracted text and mark as completed
        Prescription.objects.filter(pk=prescription_id).update(
            extracted_text=response_text,
            ocr_status='completed',
            ocr_error=None
        )

        # Delete any existing medicines from a previous failed attempt for this prescription
        Medicine.objects.filter(prescription_id=prescription_id).delete()

        # Create the Medicine objects linked to this prescription and patient
        for med_info in medicines_data:
            name = med_info.get("name", "Unknown Medicine")
            dosage = med_info.get("dosage", "N/A")
            frequency = med_info.get("frequency", "N/A")
            duration = med_info.get("duration", "N/A")
            timing = med_info.get("timing", "any")
            instructions = med_info.get("instructions", "")

            # Normalize timing
            if timing not in ['morning', 'afternoon', 'night', 'any']:
                timing = 'any'

            Medicine.objects.create(
                patient=instance.patient,
                prescription=instance,
                name=name,
                dosage=dosage,
                frequency=frequency,
                duration=duration,
                timing=timing,
                instructions=instructions
            )

        logger.info(f"Successfully processed prescription {prescription_id} and created {len(medicines_data)} medicines.")
        return True, None

    except json.JSONDecodeError as e:
        error_msg = f"AI returned invalid JSON: {e}"
        logger.error(error_msg)
        Prescription.objects.filter(pk=prescription_id).update(
            ocr_status='failed',
            ocr_error=error_msg[:500]
        )
        return False, error_msg
    except Exception as e:
        error_msg = f"OCR processing error: {e}"
        logger.error(error_msg)
        Prescription.objects.filter(pk=prescription_id).update(
            ocr_status='failed',
            ocr_error=str(e)[:500]
        )
        return False, error_msg


@receiver(post_save, sender=Prescription)
def extract_prescription_medicines(sender, instance, created, **kwargs):
    """Trigger OCR extraction when a new prescription is created."""
    if created and instance.image:
        import threading
        # Run in a background thread so the HTTP response isn't blocked
        thread = threading.Thread(target=run_prescription_ocr, args=(instance.pk,))
        thread.daemon = True
        thread.start()
