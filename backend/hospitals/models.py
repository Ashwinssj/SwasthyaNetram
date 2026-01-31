from django.db import models

class Hospital(models.Model):
    name = models.CharField(max_length=255)
    city = models.CharField(max_length=100, default='Unknown')
    address = models.TextField()
    contact_number = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
