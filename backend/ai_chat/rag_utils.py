import json
import numpy as np
import google.generativeai as genai
import os
from patients.models import Patient
import logging

logger = logging.getLogger(__name__)

# Configure Gemini
GENAI_API_KEY = os.getenv('GEMINI_API_KEY')
if GENAI_API_KEY:
    genai.configure(api_key=GENAI_API_KEY)

def get_patient_text(patient: Patient) -> str:
    """Combines patient details into a cohesive chunk of text for embedding."""
    age_str = f" Born {patient.date_of_birth}." if patient.date_of_birth else ""
    gender_str = "Male" if patient.gender == 'M' else "Female" if patient.gender == 'F' else "Other"
    
    parts = [
        f"Patient: {patient.first_name} {patient.last_name}, {gender_str}.{age_str}",
        f"Address: {patient.address}.",
    ]
    
    if patient.symptoms:
        parts.append(f"Symptoms/Reason for visit: {patient.symptoms}.")
        
    if patient.medical_history:
        parts.append(f"Medical History: {patient.medical_history}.")
        
    # Summarize SOAP notes
    soap_notes = patient.soap_notes.all().order_by('-created_at')[:3]
    if soap_notes:
        parts.append("Recent Clinical Notes:")
        for note in soap_notes:
            dr_name = f"Dr. {note.doctor.last_name}" if note.doctor else "Doctor"
            parts.append(f"- On {note.created_at.date()} by {dr_name}: Assessment: {note.assessment}. Plan: {note.plan}")
            
    return "\n".join(parts)

def embed_text(text: str) -> list[float]:
    """Calls Gemini API to get the embedding vector for the text."""
    if not GENAI_API_KEY:
        logger.warning("No GEMINI_API_KEY found. Cannot generate embeddings.")
        return []
        
    try:
        # Using text-embedding-004 which is the latest embedding model
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=text,
            task_type="retrieval_document",
        )
        return result['embedding']
    except Exception as e:
        logger.error(f"Error generating embedding: {e}")
        return []

def get_or_create_patient_embedding(patient: Patient) -> list[float] | None:
    """Gets the cached embedding, or computes and caches it if missing."""
    if patient.embedding_json:
        try:
            return json.loads(patient.embedding_json)
        except json.JSONDecodeError:
            pass # Fallback to re-embed if corrupted
            
    # Need to generate embedding
    text = get_patient_text(patient)
    embedding = embed_text(text)
    
    if embedding:
        patient.embedding_json = json.dumps(embedding)
        patient.save(update_fields=['embedding_json'])
        return embedding
        
    return None

def cosine_similarity(a: list[float], b: list[float]) -> float:
    """Calculates cosine similarity between two vectors using numpy."""
    vec_a = np.array(a)
    vec_b = np.array(b)
    dot_product = np.dot(vec_a, vec_b)
    norm_a = np.linalg.norm(vec_a)
    norm_b = np.linalg.norm(vec_b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(dot_product / (norm_a * norm_b))

def semantic_search_patients(query: str, hospital_id: int, limit: int = 3):
    """
    Finds the most semantically similar patients to the query in the given hospital.
    """
    if not GENAI_API_KEY:
        return []

    # 1. Embed the query
    try:
        query_embedding = genai.embed_content(
            model="models/text-embedding-004",
            content=query,
            task_type="retrieval_query",
        )['embedding']
    except Exception as e:
        logger.error(f"Error embedding query: {e}")
        return []

    if not query_embedding:
        return []

    # 2. Fetch patients and score them
    patients = Patient.objects.filter(hospital_id=hospital_id)
    scored_patients = []
    
    for patient in patients:
        doc_embedding = get_or_create_patient_embedding(patient)
        if doc_embedding:
            score = cosine_similarity(query_embedding, doc_embedding)
            # Only consider meaningful matches (score > 0.5 roughly depending on model)
            if score > 0.4: 
                scored_patients.append((score, patient))
                
    # 3. Sort by score descending and return top matches
    scored_patients.sort(key=lambda x: x[0], reverse=True)
    
    results = []
    for score, patient in scored_patients[:limit]:
        results.append({
            "patient": patient,
            "score": score,
            "text": get_patient_text(patient)
        })
        
    return results
