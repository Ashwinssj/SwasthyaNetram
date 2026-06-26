import os
import django
import sys
import traceback

# Add project directory to sys.path
sys.path.append(os.getcwd())

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'swasthya_backend.settings')
django.setup()

from django.core.files.uploadedfile import SimpleUploadedFile
from patients.models import Patient, Prescription, Medicine, run_prescription_ocr

def test_ocr_direct():
    print("[RUNNING] Testing Prescription OCR Direct...")
    
    # 1. Fetch or create a test patient
    patient, created = Patient.objects.get_or_create(
        first_name="John",
        last_name="Doe",
        defaults={
            "date_of_birth": "1990-01-01",
            "gender": "M",
            "contact_number": "1234567890",
            "address": "123 Main St",
        }
    )
    print(f"Using patient: {patient} (Created: {created})")
    
    # 2. Check if we have a GEMINI_API_KEY
    api_key = os.getenv('GEMINI_API_KEY')
    print(f"GEMINI_API_KEY configured: {bool(api_key)}")

    # 3. Create a valid in-memory PNG image using Pillow
    from PIL import Image
    import io
    
    img = Image.new('RGB', (100, 100), color = 'white')
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    tiny_png_bytes = img_byte_arr.getvalue()
    
    image_file = SimpleUploadedFile(
        name="test_prescription_direct.png",
        content=tiny_png_bytes,
        content_type="image/png"
    )

    # 4. Save Prescription (bypass signal by disconnecting it or just running run_prescription_ocr manually afterwards)
    print("Creating Prescription...")
    prescription = Prescription.objects.create(
        patient=patient,
        image=image_file
    )
    
    print(f"Prescription created with ID: {prescription.id}")
    
    print("Running OCR synchronously...")
    try:
        success, err = run_prescription_ocr(prescription.id)
        print(f"OCR finished with success={success}, error={err}")
    except Exception as e:
        print("Crash in run_prescription_ocr:")
        traceback.print_exc()

    # Re-fetch prescription to check status and fields
    prescription.refresh_from_db()
    print("\nVerification Results:")
    print(f"ocr_status: {prescription.ocr_status}")
    print(f"ocr_error: {prescription.ocr_error}")
    print(f"extracted_text: {prescription.extracted_text}")
    
    medicines = Medicine.objects.filter(prescription=prescription)
    print(f"Medicines count: {medicines.count()}")
    for m in medicines:
        print(f"- {m.name} | Dosage: {m.dosage} | Timing: {m.timing} | Instructions: {m.instructions}")

if __name__ == "__main__":
    test_ocr_direct()
