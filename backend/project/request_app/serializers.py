from rest_framework import serializers
from .models import User, Candidate, Resume

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'patronymic']

class CandidateSerializer(serializers.ModelSerializer):
    user = UserSerializer()

    class Meta:
        model = Candidate
        fields = ['id', 'user', 'date_of_birth', 'education', 'phone_number']

class ResumeSerializer(serializers.ModelSerializer):
    candidate = CandidateSerializer()

    class Meta:
        model = Resume
        fields = ['id', 'candidate', 'content', 'status', 'created_at']