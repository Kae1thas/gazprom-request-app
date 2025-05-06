from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils.translation import gettext_lazy as _
import uuid

# Кастомный менеджер для модели User
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

# Перечисления для статусов и образования
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

# Кастомная модель пользователя
class User(AbstractUser):
    email = models.EmailField(_('Электронная почта'), unique=True, blank=False)
    last_name = models.CharField(_('Фамилия'), max_length=150, blank=True)
    first_name = models.CharField(_('Имя'), max_length=150, blank=True)
    patronymic = models.CharField(_('Отчество'), max_length=150, blank=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

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

# Модель кандидата
class Candidate(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='candidate_profile')
    date_of_birth = models.DateField(_('Дата рождения'), null=True, blank=True)

    class Meta:
        verbose_name = 'Кандидат'
        verbose_name_plural = 'Кандидаты'

    def __str__(self):
        return self.user.__str__()

# Модель сотрудника
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

# Модель резюме
class Resume(models.Model):
    candidate = models.ForeignKey(Candidate, on_delete=models.CASCADE, related_name='resumes')
    content = models.TextField(_('Содержание'))
    education = models.CharField(_('Образование'), max_length=20, choices=EducationChoices.choices, blank=True)
    phone_number = models.CharField(_('Номер телефона'), max_length=20, blank=True)
    created_at = models.DateTimeField(_('Дата создания'), auto_now_add=True)
    status = models.CharField(_('Статус'), max_length=20, choices=ResumeStatusChoices.choices, default=ResumeStatusChoices.PENDING)
    comment = models.TextField(_('Комментарий'), max_length=500, blank=True, default='')

    class Meta:
        verbose_name = 'Резюме'
        verbose_name_plural = 'Резюме'

    def __str__(self):
        return f"Резюме {self.id} от {self.candidate.user.email}"

# Модель собеседования
class Interview(models.Model):
    candidate = models.ForeignKey(Candidate, on_delete=models.CASCADE, related_name='interviews')
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='interviews')
    scheduled_at = models.DateTimeField(_('Запланировано на'))
    status = models.CharField(_('Статус'), max_length=20, choices=InterviewStatusChoices.choices, default=InterviewStatusChoices.SCHEDULED)
    result = models.CharField(_('Результат'), max_length=20, choices=InterviewResultChoices.choices, default=InterviewResultChoices.PENDING)

    class Meta:
        verbose_name = 'Собеседование'
        verbose_name_plural = 'Собеседования'

    def __str__(self):
        return f"Собеседование {self.id} для {self.candidate.user.email}"

# Модель документа
class Document(models.Model):
    interview = models.ForeignKey(Interview, on_delete=models.CASCADE, related_name='documents')
    file_path = models.CharField(_('Путь к файлу'), max_length=255)
    uploaded_at = models.DateTimeField(_('Дата загрузки'), auto_now_add=True)
    status = models.CharField(_('Статус'), max_length=20, choices=DocumentStatusChoices.choices, default=DocumentStatusChoices.UPLOADED)

    class Meta:
        verbose_name = 'Документ'
        verbose_name_plural = 'Документы'

    def __str__(self):
        return f"Документ {self.id} для собеседования {self.interview.id}"

# Модель обратной связи
class Feedback(models.Model):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='feedbacks')
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='feedbacks')
    message = models.TextField(_('Сообщение'))
    created_at = models.DateTimeField(_('Дата создания'), auto_now_add=True)

    class Meta:
        verbose_name = 'Обратная связь'
        verbose_name_plural = 'Обратная связь'

    def __str__(self):
        return f"Обратная связь {self.id} для документа {self.document.id}"

# Модель уведомления
class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField(_('Сообщение'))
    created_at = models.DateTimeField(_('Дата создания'), auto_now_add=True)
    is_read = models.BooleanField(_('Прочитано'), default=False)

    class Meta:
        verbose_name = 'Уведомление'
        verbose_name_plural = 'Уведомления'

    def __str__(self):
        return f"Уведомление {self.id} для {self.user.email}"