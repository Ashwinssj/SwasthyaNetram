from rest_framework import serializers
from .models import ChatMessage, ChatSession

class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['id', 'role', 'content', 'timestamp']

class ChatSessionSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)
    
    class Meta:
        model = ChatSession
        fields = ['id', 'user', 'title', 'created_at', 'updated_at', 'messages']

class ChatSessionListSerializer(serializers.ModelSerializer):
    first_message = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatSession
        fields = ['id', 'title', 'created_at', 'updated_at', 'first_message']
    
    def get_first_message(self, obj):
        msg = obj.messages.first()
        return msg.content[:50] + "..." if msg else "New Chat"
