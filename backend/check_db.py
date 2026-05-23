import os
import sys
import django
from django.db import connections
from django.db.utils import OperationalError

def check_database():
    print("==================================================")
    print("SwasthyaNetram Local Database Diagnostic Utility")
    print("==================================================")
    
    # Set the settings module
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'swasthya_backend.settings')
    
    try:
        django.setup()
    except Exception as e:
        print(f"\n[ERROR] Failed to initialize Django settings.")
        print(f"Details: {e}")
        return False

    db_conn = connections['default']
    db_settings = db_conn.settings_dict
    
    engine = db_settings.get('ENGINE', '')
    name = db_settings.get('NAME', '')
    host = db_settings.get('HOST', 'localhost')
    port = db_settings.get('PORT', '5432')
    user = db_settings.get('USER', '')
    
    print(f"Engine:   {engine}")
    print(f"Database: {name}")
    print(f"Host:     {host}")
    print(f"Port:     {port}")
    print(f"User:     {user}")
    print("--------------------------------------------------")
    print("Attempting to connect...")

    try:
        # Trigger connection and cursor initialization
        db_conn.ensure_connection()
        print("\n[SUCCESS] Database connection established successfully!")
        
        # Test query
        with db_conn.cursor() as cursor:
            cursor.execute("SELECT version();")
            version = cursor.fetchone()
            print(f"Server version: {version[0]}")
            
        print("\nThe database is online and compatible with SwasthyaNetram.")
        return True
        
    except OperationalError as e:
        print(f"\n[ERROR] Connection Failed: Database is not reachable.")
        print(f"Details: {e}\n")
        print("Diagnostic Tips:")
        if 'postgresql' in engine.lower() or 'postgres' in engine.lower():
            print("1. Is your PostgreSQL server running?")
            print("   - If using Docker Compose, run: docker compose ps")
            print("     Make sure the container 'swasthya_postgres' is 'Up'.")
            print("     If not running, start it: docker compose up -d")
            print("   - If running natively, check your Windows Services to ensure the 'postgresql' service is running.")
            print("2. Are the host, port, or credentials correct?")
            print("   - Double-check the DATABASE_URL environment variable in your backend/.env file.")
            print(f"   - Currently attempting to connect to host '{host}' on port '{port}' with user '{user}'.")
            print("3. Check if the database actually exists:")
            print("   - For native installation: make sure you ran 'CREATE DATABASE swasthya_db;' in psql or pgAdmin.")
            print("   - For Docker: the default docker-compose container initializes 'swasthya_db' automatically.")
        else:
            print("1. Currently falling back to standard SQLite database.")
            print("2. To connect to PostgreSQL, make sure DATABASE_URL is defined in backend/.env.")
            
        return False
    except Exception as e:
        print(f"\n[ERROR] Unexpected error: {e}")
        return False

if __name__ == '__main__':
    success = check_database()
    print("==================================================")
    sys.exit(0 if success else 1)
