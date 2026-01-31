import os
import google.generativeai as genai
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions, viewsets
from .models import ChatSession, ChatMessage
from .serializers import ChatMessageSerializer, ChatSessionSerializer, ChatSessionListSerializer
from .ai_tools import available_tools, search_patients, update_patient_medical_history
import json

# Configure Gemini
GENAI_API_KEY = os.getenv('GEMINI_API_KEY')
if GENAI_API_KEY:
    genai.configure(api_key=GENAI_API_KEY)

class ChatSessionViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ChatSession.objects.filter(user=self.request.user).order_by('-updated_at')

    def get_serializer_class(self):
        if self.action == 'list':
            return ChatSessionListSerializer
        return ChatSessionSerializer

class ChatView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user_message = request.data.get('message')
        hospital_id = request.data.get('hospital_id')
        session_id = request.data.get('session_id')
        
        if not user_message:
            return Response({'error': 'Message is required'}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Get or Create Session
        if session_id:
            try:
                session = ChatSession.objects.get(id=session_id, user=request.user)
            except ChatSession.DoesNotExist:
                return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)
        else:
            # Create NEW session if no ID provided
            session = ChatSession.objects.create(user=request.user)
            # Auto-title based on first message
            session.title = (user_message[:30] + "...") if len(user_message) > 30 else user_message
            session.save()

        # 2. Save User Message
        ChatMessage.objects.create(session=session, role='user', content=user_message)

        ai_response_text = "I'm having trouble thinking right now."

        if GENAI_API_KEY:
            try:
                # Initialize Model with Tools
                tools_list = [search_patients, update_patient_medical_history]
                
                model = genai.GenerativeModel(
                    'gemini-3-flash-preview',
                    tools=tools_list
                )
                
                # Fetch history for this SPECIFIC session
                history_messages = []
                for msg in session.messages.order_by('timestamp'):
                    # Gemini history format: {'role': 'user'|'model', 'parts': [text]}
                    history_messages.append({
                        'role': 'user' if msg.role == 'user' else 'model',
                        'parts': [msg.content]
                    })
                
                # Start chat with history
                chat = model.start_chat(history=history_messages, enable_automatic_function_calling=True)
                
                # System Prompt injection
                system_instruction = (
                    "You are Swasthya AI, a helpful medical assistant for doctors.\n"
                    "You have legitimate access to patient data via tools.\n"
                    "Use 'search_patients' to find IDs before updating.\n"
                    "ALWAYS confirm with the user before finalizing an update if unsure.\n"
                    f"Current Hospital ID context: {hospital_id}\n"
                )
                
                # Send Message
                # Note: We don't send system instruction every time if history is loaded, 
                # but for statelss rest API it's safer to re-inject or rely on history.
                # Here we just send the user message since history is loaded.
                response = chat.send_message(f"System Context: {system_instruction}\nUser: {user_message}")
                ai_response_text = response.text
                
            except Exception as e:
                error_msg = f"AI Error: {str(e)}"
                print(error_msg)
                ai_response_text = f"I encountered an error: {str(e)}"
        else:
            ai_response_text = "AI API Key is missing."

        # 3. Save AI Message
        ai_msg = ChatMessage.objects.create(session=session, role='assistant', content=ai_response_text)
        
        # Update session timestamp
        session.save()

        # Return full response including session_id so frontend can track it
        return Response({
            'session_id': session.id,
            'role': 'assistant', 
            'content': ai_response_text
        })
    
    def get(self, request):
        # Return all sessions for user (alternative to ViewSet if needed)
        # But we are using ViewSet for sessions list, so this might be redundant or specific to single chat
        # Let's keep it simple and return the latest session messages or empty
        session = ChatSession.objects.filter(user=request.user).order_by('-updated_at').first()
        if not session:
            return Response([])
        
        messages = ChatMessage.objects.filter(session=session)
        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data)
