import os
from rest_framework_simplejwt.authentication import JWTAuthentication
from .context import gemini_api_key_var
from .models import UserProfile

class GeminiApiKeyMiddleware:
    """
    Middleware to dynamically detect authenticated requests via SimpleJWT
    and set the request-scoped ContextVar to the user's manual Gemini API Key.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        api_key = None
        
        try:
            # Check for JWT authorization header
            auth_header = request.headers.get('Authorization')
            if auth_header and auth_header.startswith('Bearer '):
                raw_token = auth_header.split(' ')[1]
                jwt_auth = JWTAuthentication()
                validated_token = jwt_auth.get_validated_token(raw_token)
                user = jwt_auth.get_user(validated_token)
                if user:
                    profile = UserProfile.objects.filter(user=user).first()
                    if profile and profile.gemini_api_key:
                        api_key = profile.gemini_api_key
        except Exception:
            # Fail silently and let other auth / permission classes handle verification
            pass

        # Bind the dynamic API key to the request context
        token = gemini_api_key_var.set(api_key)
        try:
            return self.get_response(request)
        finally:
            # Clean up context after response is processed
            gemini_api_key_var.reset(token)
