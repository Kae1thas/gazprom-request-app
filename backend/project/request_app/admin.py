from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Candidate, Employee, Resume, Interview, Document, Feedback, Notification

@admin.register(User)
class UserAdmin(UserAdmin):
    list_display = (
        'username', 'last_name', 'first_name', 'patronymic', 'email',
        'is_staff', 'is_active'
    )
    list_filter = ('is_staff', 'is_active')
    search_fields = ('username', 'first_name', 'last_name', 'patronymic', 'email')
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Персональная информация', {'fields': ('first_name', 'last_name', 'patronymic', 'email')}),
        ('Права доступа', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Даты', {'fields': ('last_login', 'date_joined')}),
    )

@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):
    list_display = ('user', 'user_email', 'date_of_birth')
    search_fields = ('user__username', 'user__first_name', 'user__last_name', 'user__patronymic', 'user__email')

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'Электронная почта'

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('user', 'department', 'position', 'hire_date')
    list_filter = ('department',)
    search_fields = ('user__username', 'user__first_name', 'user__last_name', 'user__patronymic', 'department', 'position')

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'Электронная почта'

@admin.register(Resume)
class ResumeAdmin(admin.ModelAdmin):
    list_display = ('id', 'candidate', 'education', 'phone_number', 'status', 'created_at')
    list_filter = ('status', 'education', 'created_at')
    search_fields = ('candidate__user__username', 'candidate__user__first_name', 'candidate__user__last_name', 'candidate__user__patronymic', 'content', 'phone_number')
    readonly_fields = ('created_at',)

@admin.register(Interview)
class InterviewAdmin(admin.ModelAdmin):
    list_display = ('id', 'candidate', 'employee', 'scheduled_at', 'status', 'result')
    list_filter = ('status', 'result', 'scheduled_at')
    search_fields = ('candidate__user__username', 'employee__user__username')

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ('id', 'interview', 'file_path', 'status', 'uploaded_at')
    list_filter = ('status', 'uploaded_at')
    search_fields = ('file_path', 'interview__candidate__user__username')
    readonly_fields = ('uploaded_at',)

@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ('id', 'document', 'employee', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('message', 'employee__user__username', 'document__interview__candidate__user__username')
    readonly_fields = ('created_at',)

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'message', 'created_at', 'is_read')
    list_filter = ('is_read', 'created_at')
    search_fields = ('message', 'user__email')
    readonly_fields = ('created_at',)