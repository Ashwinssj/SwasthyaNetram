import contextvars
import os

# Thread-local / async task-safe context variable to store the request-scoped API key
gemini_api_key_var = contextvars.ContextVar('gemini_api_key', default=None)

def get_gemini_api_key():
    """
    Resolves the Gemini API key to use.
    Returns:
        1. The dynamic request-scoped API key (if set via middleware)
        2. Fallback to the server environment's default GEMINI_API_KEY
    """
    key = gemini_api_key_var.get()
    if not key:
        key = os.getenv('GEMINI_API_KEY')
    return key
