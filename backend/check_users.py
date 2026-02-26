import os
import django
import sys

# Add the project directory to the sys.path
sys.path.append(os.getcwd())

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'swasthya_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

print(f"User count: {User.objects.count()}")
try:
    if User.objects.count() > 0:
        print("Users:", [u.username for u in User.objects.all()])
except Exception as e:
    print(e)
