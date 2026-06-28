import json
import numpy as np
import os
from patients.models import Patient
import logging
from users.context import get_gemini_api_key

logger = logging.getLogger(__name__)

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
            
    # Include Lab Reports text
    lab_reports = patient.lab_reports.all().order_by('-uploaded_at')[:5]
    if lab_reports:
        parts.append("Recent Lab Reports/Documents:")
        for report in lab_reports:
            parts.append(f"- Document: {report.title} (Uploaded {report.uploaded_at.date()})")
            if report.extracted_text:
                # Add snippet of the text, limit to 2000 chars per report
                snippet = report.extracted_text[:2000]
                parts.append(f"  Content snippet: {snippet}...")
            else:
                parts.append("  (No text extracted)")
            
    return "\n".join(parts)

def embed_text(text: str) -> list[float]:
    """Calls Gemini API to get the embedding vector for the text."""
    api_key = get_gemini_api_key()
    if not api_key:
        logger.warning("No Gemini API Key found. Cannot generate embeddings.")
        return []
        
    try:
        from google import genai
        from google.genai import types
        
        client = genai.Client(api_key=api_key)
        # Using text-embedding-004 which is the latest embedding model
        result = client.models.embed_content(
            model="text-embedding-004",
            contents=text,
            config=types.EmbedContentConfig(
                task_type="RETRIEVAL_DOCUMENT"
            )
        )
        return result.embeddings[0].values
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
    api_key = get_gemini_api_key()
    if not api_key:
        logger.warning("No Gemini API key found. Cannot run semantic search.")
        return []

    # 1. Embed the query
    try:
        from google import genai
        from google.genai import types
        
        client = genai.Client(api_key=api_key)
        result = client.models.embed_content(
            model="text-embedding-004",
            contents=query,
            config=types.EmbedContentConfig(
                task_type="RETRIEVAL_QUERY"
            )
        )
        query_embedding = result.embeddings[0].values
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
