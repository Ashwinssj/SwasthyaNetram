from django.db import models
from hospitals.models import Hospital

class Patient(models.Model):
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
    ]

    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='patients', null=True, blank=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    contact_number = models.CharField(max_length=15)
    address = models.TextField()
    symptoms = models.TextField(blank=True, null=True)
    medical_history = models.TextField(blank=True, null=True)
    embedding_json = models.TextField(blank=True, null=True, help_text="Stores the JSON representation of the patient vector embedding")
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
