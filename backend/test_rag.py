import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000/api"

def test_ai_rag():
    print("1. Logging in as admin...")
    resp = requests.post(f"{BASE_URL}/auth/login/", json={"username": "admin", "password": "admin"})
    
    if resp.status_code != 200:
        print("Login failed! Did you create the admin user? Error:", resp.text)
        return
        
    access_token = resp.json().get("access")
    headers = {"Authorization": f"Bearer {access_token}"}
    
    print("\n2. Getting Hospital ID...")
    hosp_resp = requests.get(f"{BASE_URL}/hospitals/", headers=headers)
    hosp_data = hosp_resp.json()
    if not hosp_data:
        print("No hospitals found.")
        return
    
    hospital_id = hosp_data[0]['id']
    print(f"Using Hospital ID: {hospital_id}")
    
    # Send a semantic query to the AI
    query = "Are there any patients dealing with fever or back pain?"
    print(f"\n3. Asking AI: '{query}'")
    
    ai_payload = {
        "message": query,
        "hospital_id": hospital_id
    }
    
    print("Waiting for Gemini and RAG response...")
    start_time = time.time()
    
    ai_resp = requests.post(f"{BASE_URL}/ai/chat/", json=ai_payload, headers=headers)
    
    print(f"\n--- AI Response ({time.time() - start_time:.2f}s) ---")
    if ai_resp.status_code == 200:
        print(ai_resp.json().get('content', 'No content returned.'))
    else:
        print(f"Error {ai_resp.status_code}:", ai_resp.text)

if __name__ == "__main__":
    test_ai_rag()
