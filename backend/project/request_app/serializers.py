from rest_framework import serializers
from .models import User, Candidate, Resume, Notification

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
        fields = ['id', 'user', 'date_of_birth']

    def create(self, validated_data):
        user_data = validated_data.pop('user')
        user_serializer = UserSerializer(data=user_data)
        if user_serializer.is_valid():
            user = user_serializer.save()
            candidate = Candidate.objects.create(user=user, **validated_data)
            return candidate
        raise serializers.ValidationError(user_serializer.errors)

class ResumeSerializer(serializers.ModelSerializer):
    education = serializers.ChoiceField(choices=[(choice, choice) for choice in ['SECONDARY', 'HIGHER', 'POSTGRADUATE']], required=False)
    phone_number = serializers.CharField(max_length=20, required=False, allow_blank=True)
    candidate = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    education_display = serializers.SerializerMethodField()

    class Meta:
        model = Resume
        fields = ['id', 'content', 'education', 'education_display', 'phone_number', 'status', 'status_display', 'created_at', 'candidate', 'comment']
        read_only_fields = ['id', 'status', 'status_display', 'created_at', 'candidate', 'education_display', 'comment']

    def get_candidate(self, obj):
        if obj.candidate and obj.candidate.user:
            return {
                'id': obj.candidate.id,
                'user': {
                    'id': obj.candidate.user.id,
                    'email': obj.candidate.user.email,
                    'last_name': obj.candidate.user.last_name or '',
                    'first_name': obj.candidate.user.first_name or '',
                    'patronymic': obj.candidate.user.patronymic or ''
                }
            }
        return None

    def get_status_display(self, obj):
        return {
            'PENDING': 'На рассмотрении',
            'ACCEPTED': 'Принято',
            'REJECTED': 'Отклонено'
        }.get(obj.status, obj.status)

    def get_education_display(self, obj):
        return {
            'SECONDARY': 'Среднее',
            'HIGHER': 'Высшее',
            'POSTGRADUATE': 'Аспирантура',
            '': 'Не указано'
        }.get(obj.education, obj.education)

    def validate_content(self, value):
        if not value.strip():
            raise serializers.ValidationError("Содержание резюме не может быть пустым")
        return value

    def validate_phone_number(self, value):
        if value:
            cleaned_value = value.replace(' ', '').replace('(', '').replace(')', '').replace('-', '')
            if not value.startswith('+7'):
                raise serializers.ValidationError("Номер телефона должен начинаться с +7")
            if len(cleaned_value) != 12:
                raise serializers.ValidationError("Номер телефона должен содержать 12 символов (включая +7)")
        return value

class ResumeStatusUpdateSerializer(serializers.ModelSerializer):
    comment = serializers.CharField(max_length=500, required=False, allow_blank=True)

    class Meta:
        model = Resume
        fields = ['status', 'comment']

class ResumeEditSerializer(serializers.ModelSerializer):
    education = serializers.ChoiceField(choices=[(choice, choice) for choice in ['SECONDARY', 'HIGHER', 'POSTGRADUATE']], required=False)
    phone_number = serializers.CharField(max_length=20, required=False, allow_blank=True)

    class Meta:
        model = Resume
        fields = ['content', 'education', 'phone_number']

    def validate_content(self, value):
        if not value.strip():
            raise serializers.ValidationError("Содержание резюме не может быть пустым")
        return value

    def validate_phone_number(self, value):
        if value:
            cleaned_value = value.replace(' ', '').replace('(', '').replace(')', '').replace('-', '')
            if not value.startswith('+7'):
                raise serializers.ValidationError("Номер телефона должен начинаться с +7")
            if len(cleaned_value) != 12:
                raise serializers.ValidationError("Номер телефона должен содержать 12 символов (включая +7)")
        return value

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'message', 'created_at', 'is_read']