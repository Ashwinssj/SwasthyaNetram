import os
from dotenv import load_dotenv
import google.generativeai as genai

# Load .env
load_dotenv()

api_key = os.getenv('GEMINI_API_KEY')
print(f"Loaded API Key: {api_key[:8]}...{api_key[-4:] if api_key else 'None'}")

if not api_key:
    print("[ERROR] No GEMINI_API_KEY found in .env")
    exit(1)

genai.configure(api_key=api_key)

try:
    print("Listing supported models for generateContent:")
    models = genai.list_models()
    for m in models:
        if 'generateContent' in m.supported_generation_methods:
            print(f"- Name: {m.name} | Display Name: {m.display_name}")
except Exception as e:
    print(f"[ERROR] Failed to list models: {e}")
