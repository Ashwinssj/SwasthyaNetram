import requests
import json

BASE_URL = "http://127.0.0.1:8000/api"

def test_flow():
    # 1. Login
    print("Attempting login...")
    login_url = f"{BASE_URL}/auth/login/"
    creds = {"username": "admin", "password": "admin"}
    try:
        resp = requests.post(login_url, json=creds)
        print(f"Login Status: {resp.status_code}")
        if resp.status_code != 200:
            print("Login failed:", resp.text)
            return

        tokens = resp.json()
        access_token = tokens.get("access")
        print("Login successful. Got access token.")
    except Exception as e:
        print(f"Login exception: {e}")
        return

    # 2. Get a patient
    print("\nFetching patients...")
    patients_url = f"{BASE_URL}/patients/"
    headers = {"Authorization": f"Bearer {access_token}"}
    try:
        resp = requests.get(patients_url, headers=headers)
        print(f"Patients Status: {resp.status_code}")
        if resp.status_code != 200:
            print("Get patients failed:", resp.text)
            return
        
        patients = resp.json()
        if not patients:
            print("No patients found. Creating one...")
            # Create a dummy patient if needed, but for now just stop
            # Let's try to create one if empty
            return
        
        patient_id = patients[0]['id']
        print(f"Using Patient ID: {patient_id}")
    except Exception as e:
        print(f"Get patients exception: {e}")
        return

    # 3. Create SOAP Note
    print("\nCreating SOAP Note...")
    notes_url = f"{BASE_URL}/patients/notes/"
    payload = {
        "patient": patient_id,
        "subjective": "Test Subjective",
        "objective": "Test Objective",
        "assessment": "Test Assessment",
        "plan": "Test Plan"
    }
    
    try:
        resp = requests.post(notes_url, json=payload, headers=headers)
        print(f"Create Note Status: {resp.status_code}")
        print("Response:", resp.text)
    except Exception as e:
        print(f"Create note exception: {e}")

if __name__ == "__main__":
    test_flow()
