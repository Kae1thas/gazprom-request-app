from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Candidate, Employee, Resume, Interview, Document, Notification, DocumentHistory

@admin.register(User)
class UserAdmin(UserAdmin):
    list_display = (
        'username', 'last_name', 'first_name', 'patronymic', 'email', 'gender', 'is_staff', 'is_active'
    )
    list_filter = ('is_staff', 'is_active', 'gender')
    search_fields = ('username', 'first_name', 'last_name', 'patronymic', 'email')
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Персональная информация', {'fields': ('first_name', 'last_name', 'patronymic', 'email', 'gender')}),
        ('Права доступа', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Даты', {'fields': ('last_login', 'date_joined')}),
    )

@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):
    list_display = ('user', 'user_email', 'date_of_birth', 'has_successful_interview')
    list_filter = ('has_successful_interview',)
    search_fields = ('user__username', 'user__first_name', 'user__last_name', 'user__patronymic', 'user__email')

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'Электронная почта'

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('user', 'user_email', 'department', 'position', 'hire_date')
    list_filter = ('department', 'hire_date')
    search_fields = ('user__username', 'user__first_name', 'user__last_name', 'user__patronymic', 'department', 'position')

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'Электронная почта'

@admin.register(Resume)
class ResumeAdmin(admin.ModelAdmin):
    list_display = ('id', 'candidate', 'resume_type', 'practice_type', 'education', 'phone_number', 'status', 'created_at')
    list_filter = ('status', 'education', 'created_at', 'resume_type', 'practice_type')
    search_fields = ('candidate__user__username', 'candidate__user__first_name', 'candidate__user__last_name', 'candidate__user__patronymic', 'content', 'phone_number')
    readonly_fields = ('created_at',)

@admin.register(Interview)
class InterviewAdmin(admin.ModelAdmin):
    list_display = ('id', 'candidate', 'employee', 'resume_type', 'practice_type', 'scheduled_at', 'status', 'result')
    list_filter = ('status', 'result', 'scheduled_at', 'resume_type', 'practice_type')
    search_fields = ('candidate__user__username', 'candidate__user__first_name', 'candidate__user__last_name', 'employee__user__username')

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ('id', 'interview', 'document_type', 'file_path', 'status', 'uploaded_at')
    list_filter = ('status', 'document_type', 'uploaded_at')
    search_fields = ('file_path', 'document_type', 'interview__candidate__user__username')
    readonly_fields = ('uploaded_at',)

@admin.register(DocumentHistory)
class DocumentHistoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'document', 'status', 'comment', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('comment', 'document__document_type', 'document__interview__candidate__user__username')
    readonly_fields = ('created_at',)

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'message', 'created_at', 'is_read')
    list_filter = ('is_read', 'created_at')
    search_fields = ('message', 'user__email')
    readonly_fields = ('created_at',)