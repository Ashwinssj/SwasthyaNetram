import os
import django
import sys

# Add project directory to sys.path
sys.path.append(os.getcwd())

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'swasthya_backend.settings')
django.setup()

from django.core.files.uploadedfile import SimpleUploadedFile
from patients.models import Patient, Prescription, Medicine

def test_ocr():
    print("[RUNNING] Testing Prescription OCR Signals...")
    
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
    if not api_key:
        print("[WARNING] No GEMINI_API_KEY found. Signal will skip actual API call but Django structures should be valid.")
    else:
        print(f"[OK] GEMINI_API_KEY is configured.")

    # 3. Create a valid in-memory PNG image using Pillow
    from PIL import Image
    import io
    
    img = Image.new('RGB', (10, 10), color = 'white')
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    tiny_png_bytes = img_byte_arr.getvalue()
    
    image_file = SimpleUploadedFile(
        name="test_prescription.png",
        content=tiny_png_bytes,
        content_type="image/png"
    )

    # 4. Save Prescription (which triggers post-save signal)
    print("Creating Prescription database object (should fire post_save signal)...")
    prescription = Prescription.objects.create(
        patient=patient,
        image=image_file
    )
    
    # 5. Check if any Medicines were created
    print("\nVerification Results:")
    print(f"Prescription created with ID: {prescription.id}")
    print(f"Prescription image path: {prescription.image.name}")
    print(f"Prescription extracted_text: {prescription.extracted_text}")
    
    medicines = Medicine.objects.filter(prescription=prescription)
    print(f"Medicines count linked to this prescription: {medicines.count()}")
    for m in medicines:
        print(f"- {m.name} | Dosage: {m.dosage} | Timing: {m.timing} | Instructions: {m.instructions}")
        
    print("\n[SUCCESS] Script executed without any compilation or database crashes.")

if __name__ == "__main__":
    test_ocr()
