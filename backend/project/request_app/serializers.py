from rest_framework import serializers
from django.db import models
from .models import User, Candidate, Resume, Notification, Interview, Document, Employee

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

class EmployeeSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Employee
        fields = ['id', 'user', 'department', 'position', 'hire_date']

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

class InterviewCreateSerializer(serializers.ModelSerializer):
    candidate = serializers.PrimaryKeyRelatedField(queryset=Candidate.objects.all())
    employee = serializers.PrimaryKeyRelatedField(queryset=Employee.objects.all())

    class Meta:
        model = Interview
        fields = ['candidate', 'employee', 'scheduled_at']

    def validate_scheduled_at(self, value):
        from django.utils import timezone
        if value < timezone.now():
            raise serializers.ValidationError("Дата и время собеседования не могут быть в прошлом")
        return value

    def validate(self, data):
        candidate = data['candidate']
        employee = data['employee']
        scheduled_at = data['scheduled_at']
        # Проверка, есть ли у кандидата принятое резюме
        if not Resume.objects.filter(candidate=candidate, status='ACCEPTED').exists():
            raise serializers.ValidationError("Кандидат должен иметь хотя бы одно принятое резюме")
        # Проверка конфликтов расписания
        if Interview.objects.filter(
            models.Q(candidate=candidate) | models.Q(employee=employee),
            scheduled_at=scheduled_at
        ).exists():
            raise serializers.ValidationError("Кандидат или сотрудник уже заняты в это время")
        return data

class InterviewSerializer(serializers.ModelSerializer):
    candidate = CandidateSerializer(read_only=True)
    employee = EmployeeSerializer(read_only=True)

    class Meta:
        model = Interview
        fields = ['id', 'candidate', 'employee', 'scheduled_at', 'status', 'result', 'comment']

class DocumentSerializer(serializers.ModelSerializer):
    interview = InterviewSerializer(read_only=True)
    file_path = serializers.FileField(write_only=True, required=False)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Document
        fields = ['id', 'interview', 'file_path', 'uploaded_at', 'status', 'status_display', 'comment']

    def validate_file_path(self, value):
        if value:
            if not value.name.endswith(('.pdf', '.doc', '.docx')):
                raise serializers.ValidationError('Файл должен быть в формате PDF, DOC или DOCX')
            if value.size > 5 * 1024 * 1024:  # 5MB
                raise serializers.ValidationError('Размер файла не должен превышать 5 МБ')
        return value

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'user', 'message', 'is_read', 'created_at']