from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils.translation import gettext_lazy as _

import uuid

def candidate_document_path(instance, filename):
    candidate_id = instance.interview.candidate.id
    return f'candidate_{candidate_id}/{filename}'

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_('Электронная почта обязательна'))
        email = self.normalize_email(email)
        username = extra_fields.pop('username', email.split('@')[0] + str(uuid.uuid4())[:8])
        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Суперпользователь должен иметь is_staff=True'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Суперпользователь должен иметь is_superuser=True'))
        return self.create_user(email, password, **extra_fields)

class NotificationTypeChoices(models.TextChoices):
    REGISTRATION = 'REGISTRATION', _('Регистрация')
    RESUME_STATUS = 'RESUME_STATUS', _('Статус резюме')
    INTERVIEW = 'INTERVIEW', _('Собеседование')
    DOCUMENT = 'DOCUMENT', _('Документ')
    HIRE = 'HIRE', _('Прием')
    OTHER = 'OTHER', _('Другое')

class ResumeTypeChoices(models.TextChoices):
    JOB = 'JOB', _('Работа')
    PRACTICE = 'PRACTICE', _('Практика')

class PracticeTypeChoices(models.TextChoices):
    PRE_DIPLOMA = 'PRE_DIPLOMA', _('Преддипломная')
    PRODUCTION = 'PRODUCTION', _('Производственная')
    EDUCATIONAL = 'EDUCATIONAL', _('Учебная')

class EducationChoices(models.TextChoices):
    SECONDARY = 'SECONDARY', _('Среднее')
    HIGHER = 'HIGHER', _('Высшее')
    POSTGRADUATE = 'POSTGRADUATE', _('Аспирантура')

class ResumeStatusChoices(models.TextChoices):
    PENDING = 'PENDING', _('На рассмотрении')
    ACCEPTED = 'ACCEPTED', _('Принято')
    REJECTED = 'REJECTED', _('Отклонено')

class InterviewStatusChoices(models.TextChoices):
    SCHEDULED = 'SCHEDULED', _('Запланировано')
    COMPLETED = 'COMPLETED', _('Проведено')
    CANCELLED = 'CANCELLED', _('Отменено')

class InterviewResultChoices(models.TextChoices):
    SUCCESS = 'SUCCESS', _('Успешно')
    FAILURE = 'FAILURE', _('Неуспешно')
    PENDING = 'PENDING', _('Ожидает')

class DocumentStatusChoices(models.TextChoices):
    UPLOADED = 'UPLOADED', _('Загружен')
    UNDER_REVIEW = 'UNDER_REVIEW', _('На проверке')
    ACCEPTED = 'ACCEPTED', _('Принят')
    REJECTED = 'REJECTED', _('Отклонен')
    DELETED = 'DELETED', _('Удалён')

class DocumentTypeChoices(models.TextChoices):
    PASSPORT = 'Паспорт', _('Паспорт')
    MILITARY = 'Приписное/Военник', _('Приписное/Военник')
    DIPLOMA = 'Аттестат/Диплом', _('Аттестат/Диплом')
    PSYCH = 'Справка с психодиспансера', _('Справка с психодиспансера')
    NARC = 'Справка с наркодиспансера', _('Справка с наркодиспансера')
    CRIMINAL = 'Справка о несудимости', _('Справка о несудимости')
    CONSENT = 'Согласие на обработку персональных данных', _('Согласие на обработку персональных данных')
    INN = 'ИНН', _('ИНН')
    SNILS = 'СНИЛС', _('СНИЛС')
    LABOR_BOOK = 'Трудовая книжка (опционально)', _('Трудовая книжка (опционально)')
    PRACTICE_AGREEMENT = 'Договор о практике', _('Договор о практике')
    PRACTICE_REQUEST = 'Заявление на практику', _('Заявление на практику')

class GenderChoices(models.TextChoices):
    MALE = 'MALE', _('Мужской')
    FEMALE = 'FEMALE', _('Женский')

class JobTypeChoices(models.TextChoices):
    PROGRAMMER = 'PROGRAMMER', _('Инженер-программист')
    METHODOLOGIST = 'METHODOLOGIST', _('Методолог')
    SPECIALIST = 'SPECIALIST', _('Специалист')

class User(AbstractUser):
    email = models.EmailField(_('Электронная почта'), unique=True, blank=False)
    last_name = models.CharField(_('Фамилия'), max_length=150, blank=True)
    first_name = models.CharField(_('Имя'), max_length=150, blank=True)
    patronymic = models.CharField(_('Отчество'), max_length=150, blank=True)
    gender = models.CharField(_('Пол'), max_length=10, choices=GenderChoices.choices, blank=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['gender']

    class Meta:
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'

    def __str__(self):
        full_name = f"{self.last_name} {self.first_name} {self.patronymic}".strip()
        return full_name if full_name else self.email

    def save(self, *args, **kwargs):
        if not self.username:
            self.username = self.email.split('@')[0] + str(uuid.uuid4())[:8]
        super().save(*args, **kwargs)
        if hasattr(self, 'candidate_profile') and hasattr(self, 'employee_profile'):
            raise ValueError(_('Пользователь не может быть одновременно кандидатом и сотрудником'))

class Candidate(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='candidate_profile')
    date_of_birth = models.DateField(_('Дата рождения'), null=True, blank=True)
    has_successful_interview = models.BooleanField(_('Успешное собеседование'), default=False)

    class Meta:
        verbose_name = 'Кандидат'
        verbose_name_plural = 'Кандидаты'

    def __str__(self):
        return self.user.__str__()

class Employee(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='employee_profile')
    department = models.CharField(_('Отдел'), max_length=100, blank=True)
    position = models.CharField(_('Должность'), max_length=100, blank=True)
    hire_date = models.DateField(_('Дата найма'), null=True, blank=True)

    class Meta:
        verbose_name = 'Сотрудник'
        verbose_name_plural = 'Сотрудники'

    def __str__(self):
        return self.user.__str__()

class Resume(models.Model):
    candidate = models.ForeignKey(Candidate, on_delete=models.CASCADE, related_name='resumes')
    content = models.TextField(_('Содержание'))
    education = models.CharField(_('Образование'), max_length=20, choices=EducationChoices.choices, blank=True)
    phone_number = models.CharField(_('Номер телефона'), max_length=20, blank=True)
    created_at = models.DateTimeField(_('Дата создания'), auto_now_add=True)
    status = models.CharField(_('Статус'), max_length=20, choices=ResumeStatusChoices.choices, default=ResumeStatusChoices.PENDING)
    comment = models.TextField(_('Комментарий'), max_length=500, blank=True, default='')
    resume_type = models.CharField(_('Тип заявки'), max_length=20, choices=ResumeTypeChoices.choices, default=ResumeTypeChoices.JOB)
    practice_type = models.CharField(_('Тип практики'), max_length=20, choices=PracticeTypeChoices.choices, blank=True, null=True)
    job_type = models.CharField(_('Тип работы'), max_length=20, choices=JobTypeChoices.choices, blank=True, null=True)

    class Meta:
        verbose_name = 'Резюме'
        verbose_name_plural = 'Резюме'

    def __str__(self):
        return f"Резюме {self.id} ({self.get_resume_type_display()}) от {self.candidate.user.email}"

class Interview(models.Model):
    candidate = models.ForeignKey(Candidate, on_delete=models.CASCADE, related_name='interviews')
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='interviews')
    scheduled_at = models.DateTimeField(_('Запланировано на'))
    status = models.CharField(_('Статус'), max_length=20, choices=InterviewStatusChoices.choices, default=InterviewStatusChoices.SCHEDULED)
    result = models.CharField(_('Результат'), max_length=20, choices=InterviewResultChoices.choices, default=InterviewResultChoices.PENDING)
    comment = models.TextField(blank=True)
    resume_type = models.CharField(_('Тип заявки'), max_length=20, choices=ResumeTypeChoices.choices, default=ResumeTypeChoices.JOB)
    practice_type = models.CharField(_('Тип практики'), max_length=20, choices=PracticeTypeChoices.choices, blank=True, null=True)
    job_type = models.CharField(_('Тип работы'), max_length=20, choices=JobTypeChoices.choices, blank=True, null=True)

    class Meta:
        verbose_name = 'Собеседование'
        verbose_name_plural = 'Собеседования'
        ordering = ['scheduled_at']

    def __str__(self):
        return f"Собеседование {self.id} ({self.get_resume_type_display()}) для {self.candidate.user.email}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.result == 'SUCCESS':
            self.candidate.has_successful_interview = True
            self.candidate.save()
        elif self.result in ['FAILURE', 'PENDING']:
            has_other_success = Interview.objects.filter(
                candidate=self.candidate, result='SUCCESS', resume_type=self.resume_type
            ).exclude(id=self.id).exists()
            self.candidate.has_successful_interview = has_other_success
            self.candidate.save()

class Document(models.Model):
    interview = models.ForeignKey(Interview, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(_('Тип документа'), max_length=100, choices=DocumentTypeChoices.choices)
    file_path = models.FileField(upload_to=candidate_document_path)
    uploaded_at = models.DateTimeField(_('Дата загрузки'), auto_now_add=True)
    status = models.CharField(_('Статус'), max_length=20, choices=DocumentStatusChoices.choices, default=DocumentStatusChoices.UPLOADED)
    comment = models.TextField(_('Комментарий'), max_length=500, blank=True, default='')

    class Meta:
        verbose_name = 'Документ'
        verbose_name_plural = 'Документы'
        unique_together = ['interview', 'document_type']

    def __str__(self):
        return f"Документ {self.id} ({self.document_type}) для собеседования {self.interview.id}"

class DocumentHistory(models.Model):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='history')
    status = models.CharField(_('Статус'), max_length=20, choices=DocumentStatusChoices.choices)
    comment = models.TextField(_('Комментарий'), max_length=500, blank=True, default='')
    created_at = models.DateTimeField(_('Дата изменения'), auto_now_add=True)

    class Meta:
        verbose_name = 'История документа'
        verbose_name_plural = 'История документов'

    def __str__(self):
        return f"История документа {self.document.id} от {self.created_at}"

class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField(_('Сообщение'))
    created_at = models.DateTimeField(_('Дата создания'), auto_now_add=True)
    is_read = models.BooleanField(_('Прочитано'), default=False)
    sent_to_email = models.BooleanField(_('Отправлено на email'), default=False)
    type = models.CharField(_('Тип'), max_length=20, choices=NotificationTypeChoices.choices, default=NotificationTypeChoices.OTHER)

    class Meta:
        verbose_name = 'Уведомление'
        verbose_name_plural = 'Уведомления'

    def __str__(self):
        return f"Уведомление {self.id} для {self.user.email}"