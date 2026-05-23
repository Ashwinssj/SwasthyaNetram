import os
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions, viewsets
from .models import ChatSession, ChatMessage
from .serializers import ChatMessageSerializer, ChatSessionSerializer, ChatSessionListSerializer
from langchain_core.messages import HumanMessage, AIMessage
from .agent import agent_graph
import json

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
        api_key = os.getenv('GEMINI_API_KEY')

        if api_key:
            try:
                # Fetch history for this SPECIFIC session from the database
                history_messages = []
                for msg in session.messages.order_by('timestamp'):
                    if msg.role == 'user':
                        history_messages.append(HumanMessage(content=msg.content))
                    else:
                        history_messages.append(AIMessage(content=msg.content))
                
                # Execute the LangGraph stateful agent
                inputs = {
                    "messages": history_messages,
                    "hospital_id": int(hospital_id) if hospital_id else 0
                }
                
                result = agent_graph.invoke(inputs)
                
                # Retrieve the terminal agent message content
                ai_response_text = result["messages"][-1].content
                
            except Exception as e:
                error_msg = f"AI Graph Error: {str(e)}"
                print(error_msg)
                ai_response_text = f"I encountered an error: {str(e)}"
        else:
            ai_response_text = "AI API Key is missing. Please configure GEMINI_API_KEY in your .env file."

        # 3. Save AI Message
        ChatMessage.objects.create(session=session, role='assistant', content=ai_response_text)
        
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
