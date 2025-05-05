from rest_framework import serializers
from .models import User, Candidate, Resume

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, min_length=8)

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'patronymic', 'password']
        read_only_fields = ['id']

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            patronymic=validated_data.get('patronymic', '')
        )
        return user

class CandidateSerializer(serializers.ModelSerializer):
    user = UserSerializer()

    class Meta:
        model = Candidate
        fields = ['id', 'user', 'date_of_birth', 'education', 'phone_number']

class ResumeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resume
        fields = ['id', 'content', 'status', 'created_at']
        read_only_fields = ['id', 'status', 'created_at']

    def validate_content(self, value):
        if not value.strip():
            raise serializers.ValidationError("Содержание резюме не может быть пустым")
        return value

class ResumeStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resume
        fields = ['status']

class ResumeEditSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resume
        fields = ['content']

    def validate_content(self, value):
        if not value.strip():
            raise serializers.ValidationError("Содержание резюме не может быть пустым")
        return value