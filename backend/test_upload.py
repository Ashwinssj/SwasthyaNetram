import requests
import json

BASE_URL = "http://127.0.0.1:8000/api"

def test_upload():
    print("1. Logging in as admin...")
    resp = requests.post(f"{BASE_URL}/auth/login/", json={"username": "admin", "password": "admin"})
    
    if resp.status_code != 200:
        print("Login failed! Error:", resp.text)
        return
        
    access_token = resp.json().get("access")
    headers = {"Authorization": f"Bearer {access_token}"}
    
    print("\n2. Getting Patient ID...")
    pat_resp = requests.get(f"{BASE_URL}/patients/", headers=headers)
    pat_data = pat_resp.json()
    if not pat_data:
        print("No patients found.")
        return
    
    patient_id = pat_data[0]['id']
    print(f"Using Patient ID: {patient_id}")
    
    # 3. Create dummy file
    with open("dummy_test.txt", "w") as f:
        f.write("This is a dummy lab report for testing uploads.")
        
    print("\n3. Testing File Upload...")
    upload_url = f"{BASE_URL}/patients/reports/"
    
    try:
        with open("dummy_test.txt", "rb") as f:
            files = {'file': f}
            data = {'patient': patient_id, 'title': 'Dummy Test Report'}
            
            # Note: For multipart/form-data, requests sets the boundary and content type automatically when `files` is passed
            upload_resp = requests.post(upload_url, data=data, files=files, headers=headers)
            
            print(f"Upload Status: {upload_resp.status_code}")
            print(f"Upload Response: {upload_resp.text}")
    finally:
        import os
        if os.path.exists("dummy_test.txt"):
            os.remove("dummy_test.txt")

if __name__ == "__main__":
    test_upload()
