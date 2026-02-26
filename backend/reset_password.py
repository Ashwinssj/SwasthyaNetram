import os
import django
import sys

# Add the project directory to the sys.path
sys.path.append(os.getcwd())

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'swasthya_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

try:
    user = User.objects.get(username='admin')
    user.set_password('admin')
    user.save()
    print("Successfully reset password for user 'admin' to 'admin'.")
except params.DoesNotExist:
    print("User 'admin' does not exist.")
except Exception as e:
    print(f"Error: {e}")
