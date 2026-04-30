from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import serializers
from .models import User
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

# serializers 
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'phone_number', 'company_name', 'category']

# Tacks role,email and username after login
class CustomTokenSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        data['role']     = user.role
        data['email']    = user.email
        data['username'] = user.username
        return data
class CustomTokenView(TokenObtainPairView):
    serializer_class = CustomTokenSerializer

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class UpdateMeView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        user = request.user
        data = request.data

        new_username = data.get('username', '').strip()
        new_email    = data.get('email', '').strip()
        new_phone    = data.get('phone_number', '').strip()

        # email check
        if new_username and new_username != user.username:
            if User.objects.filter(username=new_username).exclude(pk=user.pk).exists():
                return Response({"error": "Username already taken."}, status=400)
            user.username = new_username

        if new_email and new_email != user.email:
            if User.objects.filter(email=new_email).exclude(pk=user.pk).exists():
                return Response({"error": "Email already in use."}, status=400)
            user.email = new_email

        if new_phone:
            user.phone_number = new_phone

        user.save()
        serializer = UserSerializer(user)
        return Response(serializer.data)
#  working hours 
class WorkingHoursView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(request.user.working_hours or {})

    def put(self, request):
        request.user.working_hours = request.data
        request.user.save()
        return Response(request.user.working_hours)
# signup
class SignupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        try:
            user = User.objects.create_user(
                username=data.get('username'),
                email=data.get('email'),
                password=data.get('password'),
                role=data.get('role', 'customer')
            )
            user.company_name = data.get('company_name', '')
            user.phone_number = data.get('phone_number', '')
            user.category     = data.get('category', '')
            user.save()

            return Response({"detail": "User created successfully"}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
