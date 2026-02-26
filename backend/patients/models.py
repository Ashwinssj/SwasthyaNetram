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
    uploaded_at = models.DateTimeField(auto_now_add=True)

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
