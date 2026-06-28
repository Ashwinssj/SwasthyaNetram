from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.models import User
from .serializers import RegisterSerializer, ChangePasswordSerializer
from rest_framework.permissions import AllowAny

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

class ChangePasswordView(generics.UpdateAPIView):
    serializer_class = ChangePasswordSerializer
    model = User
    permission_classes = (IsAuthenticated,)

    def get_object(self, queryset=None):
        return self.request.user

    def update(self, request, *args, **kwargs):
        self.object = self.get_object()
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            # Check old password
            if not self.object.check_password(serializer.data.get("old_password")):
                return Response({"old_password": ["Wrong password."]}, status=status.HTTP_400_BAD_REQUEST)
            
            # set_password also hashes the password that the user will get
            self.object.set_password(serializer.data.get("new_password"))
            self.object.save()
            return Response({"status": "success", "code": status.HTTP_200_OK, "message": "Password updated successfully"}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

from rest_framework.views import APIView
from .models import UserProfile

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        is_admin = user.is_superuser
        
        # Lazy-create profile if missing
        profile, _ = UserProfile.objects.get_or_create(user=user)
        
        role = "Hospital User"
        plan = "Standard Access"
        ai_plan = "Pro Plan"
        
        if is_admin:
            role = "Administrator"
            plan = "Superuser"
            ai_plan = "Enterprise Plan"
            
        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email or f"{user.username}@example.com",
            "is_superuser": user.is_superuser,
            "role": role,
            "plan": plan,
            "ai_plan": ai_plan,
            "gemini_api_key": profile.gemini_api_key or ""
        })

    def put(self, request):
        user = request.user
        profile, _ = UserProfile.objects.get_or_create(user=user)
        
        gemini_api_key = request.data.get('gemini_api_key')
        if gemini_api_key is not None:
            profile.gemini_api_key = gemini_api_key.strip()
            profile.save()
            
        return Response({
            "status": "success",
            "message": "Gemini API key updated successfully",
            "gemini_api_key": profile.gemini_api_key or ""
        })

