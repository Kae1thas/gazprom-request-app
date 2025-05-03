from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _

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
    email = models.EmailField(_('Электронная почта'), unique=True)
    last_name = models.CharField(_('Фамилия'), max_length=150, blank=True)
    first_name = models.CharField(_('Имя'), max_length=150, blank=True)
    patronymic = models.CharField(_('Отчество'), max_length=150, blank=True)

    class Meta:
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'

    def __str__(self):
        full_name = f"{self.last_name} {self.first_name} {self.patronymic}".strip()
        return full_name if full_name else self.username

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Проверка: пользователь не может быть одновременно кандидатом и сотрудником
        if hasattr(self, 'candidate_profile') and hasattr(self, 'employee_profile'):
            raise ValueError(_('Пользователь не может быть одновременно кандидатом и сотрудником'))

# Модель кандидата
class Candidate(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='candidate_profile')
    date_of_birth = models.DateField(_('Дата рождения'), null=True, blank=True)
    education = models.CharField(_('Образование'), max_length=20, choices=EducationChoices.choices, blank=True)
    phone_number = models.CharField(_('Номер телефона'), max_length=15, blank=True)

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
    created_at = models.DateTimeField(_('Дата создания'), auto_now_add=True)
    status = models.CharField(_('Статус'), max_length=20, choices=ResumeStatusChoices.choices, default=ResumeStatusChoices.PENDING)

    class Meta:
        verbose_name = 'Резюме'
        verbose_name_plural = 'Резюме'

    def __str__(self):
        return f"Резюме {self.id} от {self.candidate.user.username}"

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
        return f"Собеседование {self.id} для {self.candidate.user.username}"

# Модель документа
class Document(models.Model):
    interview = models.ForeignKey(Interview, on_delete=models.CASCADE, related_name='documents')
    file_path = models.CharField(_('Путь к файлу'), max_length=255)  # Замените на FileField для реальной загрузки
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