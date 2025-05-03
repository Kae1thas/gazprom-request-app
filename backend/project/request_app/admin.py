from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Candidate, Employee, Resume, Interview, Document, Feedback

# Настройка админ-панели для модели User
@admin.register(User)
class UserAdmin(UserAdmin):
    list_display = (
        'username', 'last_name', 'first_name', 'patronymic', 'email',
        'is_staff', 'is_active'
    )
    list_filter = ('is_staff', 'is_active')
    search_fields = ('username', 'first_name', 'last_name', 'patronymic', 'email', 'phone_number')
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Персональная информация', {'fields': ('first_name', 'last_name', 'patronymic', 'email')}),
        ('Права доступа', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Даты', {'fields': ('last_login', 'date_joined')}),
    )

# Настройка админ-панели для модели Candidate
@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):
    list_display = ('user', 'user_email', 'date_of_birth', 'education', 'phone_number')
    list_filter = ('education',)
    search_fields = ('user__username', 'user__first_name', 'user__last_name', 'user__patronymic', 'user__email', 'phone_number')

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'Электронная почта'

# Настройка админ-панели для модели Employee
@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('user', 'department', 'position', 'hire_date')
    list_filter = ('department',)
    search_fields = ('user__username', 'user__first_name', 'user__last_name', 'user__patronymic', 'department', 'position')

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'Электронная почта'

# Настройка админ-панели для модели Resume
@admin.register(Resume)
class ResumeAdmin(admin.ModelAdmin):
    list_display = ('id', 'candidate', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('candidate__user__username', 'candidate__user__first_name', 'candidate__user__last_name', 'candidate__user__patronymic', 'content')
    readonly_fields = ('created_at',)

# Настройка админ-панели для модели Interview
@admin.register(Interview)
class InterviewAdmin(admin.ModelAdmin):
    list_display = ('id', 'candidate', 'employee', 'scheduled_at', 'status', 'result')
    list_filter = ('status', 'result', 'scheduled_at')
    search_fields = ('candidate__user__username', 'employee__user__username')

# Настройка админ-панели для модели Document
@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ('id', 'interview', 'file_path', 'status', 'uploaded_at')
    list_filter = ('status', 'uploaded_at')
    search_fields = ('file_path', 'interview__candidate__user__username')
    readonly_fields = ('uploaded_at',)

# Настройка админ-панели для модели Feedback
@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ('id', 'document', 'employee', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('message', 'employee__user__username', 'document__interview__candidate__user__username')
    readonly_fields = ('created_at',)