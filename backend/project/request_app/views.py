from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from django.utils import timezone
from rest_framework.response import Response
import logging
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.db import models
from django.db.models import Q
from django.db.utils import IntegrityError
from .models import User, Candidate, Resume, Employee, Notification, Interview, Document, DocumentHistory
from .serializers import (
    CandidateSerializer, ResumeSerializer, UserSerializer,
    ResumeStatusUpdateSerializer, ResumeEditSerializer,
    NotificationSerializer, InterviewSerializer, InterviewCreateSerializer,
    DocumentSerializer, EmployeeSerializer, DocumentHistorySerializer
)
from rest_framework_simplejwt.tokens import RefreshToken
from .utils import send_notification_email
from datetime import datetime

logger = logging.getLogger(__name__)

class CandidateViewSet(viewsets.ModelViewSet):
    queryset = Candidate.objects.all()
    serializer_class = CandidateSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

class ResumeViewSet(viewsets.ModelViewSet):
    queryset = Resume.objects.all()
    serializer_class = ResumeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Resume.objects.all()
        return Resume.objects.filter(candidate__user=self.request.user)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my(self, request):
        try:
            candidate = Candidate.objects.get(user=request.user)
            resumes = Resume.objects.filter(candidate=candidate)
            serializer = ResumeSerializer(resumes, many=True)
            return Response(serializer.data)
        except Candidate.DoesNotExist:
            return Response({'error': 'Кандидат не найден'}, status=status.HTTP_404_NOT_FOUND)

class RegisterView(APIView):
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            Candidate.objects.create(user=user, has_successful_interview=False)
            
            Notification.objects.create(
                user=user,
                message=f"Добро пожаловать, {user.first_name}! Ваша регистрация прошла успешно.",
                type='REGISTRATION',
                sent_to_email=True
            )
            
            send_notification_email(
                subject='Добро пожаловать на платформу!',
                template_name='emails/registration.html',
                context={
                    'user': user,
                },
                recipient_list=[user.email]
            )
            
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token)
            }, status=status.HTTP_201_CREATED)
        errors = serializer.errors
        if 'email' in errors:
            errors['email'] = 'Пользователь с таким email уже существует'
        return Response(errors, status=status.HTTP_400_BAD_REQUEST)

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        response_data = {
            'user': UserSerializer(user).data,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
        }
        try:
            candidate = Candidate.objects.get(user=user)
            response_data['candidate'] = CandidateSerializer(candidate).data
            logger.info(f"MeView: Candidate {candidate.id} has_successful_interview={candidate.has_successful_interview}")
        except Candidate.DoesNotExist:
            response_data['candidate'] = None
        try:
            employee = Employee.objects.get(user=user)
            response_data['employee'] = {
                'department': employee.department,
                'position': employee.position,
                'hire_date': employee.hire_date
            }
        except Employee.DoesNotExist:
            response_data['employee'] = None
        return Response(response_data, status=status.HTTP_200_OK)

class ResumeCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            candidate = Candidate.objects.get(user=request.user)
        except Candidate.DoesNotExist:
            return Response({'error': 'Только кандидаты могут подавать резюме'}, status=status.HTTP_403_FORBIDDEN)
        serializer = ResumeSerializer(data=request.data)
        if serializer.is_valid():
            try:
                resume = serializer.save(candidate=candidate)
                vacancy_name = resume.get_job_type_display() if resume.resume_type == 'JOB' else resume.get_practice_type_display()
                Notification.objects.create(
                    user=resume.candidate.user,
                    message=f'Ваше резюме на {resume.get_resume_type_display()} ({vacancy_name}) успешно отправлено.',
                    type='RESUME_STATUS',
                    sent_to_email=True
                )
                send_notification_email(
                    subject='Ваше резюме отправлено',
                    template_name='emails/resume_submission.html',
                    context={
                        'user': resume.candidate.user,
                        'vacancy_name': vacancy_name,
                        'resume_type': resume.get_resume_type_display(),
                    },
                    recipient_list=[resume.candidate.user.email]
                )
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({'error': f'Ошибка при сохранении резюме: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ResumeStatusUpdateView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def patch(self, request, pk):
        try:
            resume = Resume.objects.get(pk=pk)
        except Resume.DoesNotExist:
            return Response({'error': 'Резюме не найдено'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ResumeStatusUpdateSerializer(resume, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            comment = serializer.validated_data.get('comment', '')
            status_display = {
                'PENDING': 'На рассмотрении',
                'ACCEPTED': 'Принято',
                'REJECTED': 'Отклонено'
            }.get(resume.status, resume.status)
            vacancy_name = resume.get_job_type_display() if resume.resume_type == 'JOB' else resume.get_practice_type_display()
            message = f'Статус вашего резюме на {resume.get_resume_type_display()} ({vacancy_name}) изменен на: {status_display}'
            if comment:
                message += f'\nКомментарий: {comment}'
            Notification.objects.create(
                user=resume.candidate.user,
                message=message,
                type='RESUME_STATUS',
                sent_to_email=True
            )
            
            send_notification_email(
                subject='Изменение статуса резюме',
                template_name='emails/resume_status.html',
                context={
                    'user': resume.candidate.user,
                    'resume_type': resume.get_resume_type_display(),
                    'vacancy_name': vacancy_name,
                    'status': status_display,
                    'comment': comment or 'Отсутствует'
                },
                recipient_list=[resume.candidate.user.email]
            )
            
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ResumeDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            candidate = Candidate.objects.get(user=request.user)
            resume = Resume.objects.get(pk=pk, candidate=candidate)
        except Candidate.DoesNotExist:
            return Response({'error': 'Кандидат не найден'}, status=status.HTTP_404_NOT_FOUND)
        except Resume.DoesNotExist:
            return Response({'error': 'Резюме не найдено или не принадлежит вам'}, status=status.HTTP_404_NOT_FOUND)

        resume.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class ResumeEditView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            candidate = Candidate.objects.get(user=request.user)
            resume = Resume.objects.get(pk=pk, candidate=candidate)
        except Candidate.DoesNotExist:
            return Response({'error': 'Кандидат не найден'}, status=status.HTTP_404_NOT_FOUND)
        except Resume.DoesNotExist:
            return Response({'error': 'Резюме не найдено или не принадлежит вам'}, status=status.HTTP_404_NOT_FOUND)

        if resume.status == 'ACCEPTED':
            return Response({'error': 'Нельзя редактировать принятое резюме'}, status=status.HTTP_403_FORBIDDEN)

        serializer = ResumeEditSerializer(resume, data=request.data, partial=True)
        if serializer.is_valid():
            resume.status = 'PENDING'
            resume.comment = ''
            resume.save()
            serializer.save()
            return Response(ResumeSerializer(resume).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class NotificationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifications = Notification.objects.filter(user=request.user).order_by('-created_at')
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data)

    def patch(self, request, pk):
        try:
            notification = Notification.objects.get(pk=pk, user=request.user)
        except Notification.DoesNotExist:
            return Response({'error': 'Уведомление не найдено'}, status=status.HTTP_404_NOT_FOUND)
        serializer = NotificationSerializer(notification, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class InterviewViewSet(viewsets.ModelViewSet):
    queryset = Interview.objects.all()
    serializer_class = InterviewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Interview.objects.all()
        return Interview.objects.filter(candidate__user=self.request.user)

    def get_serializer_class(self):
        if self.action == 'create_interview':
            return InterviewCreateSerializer
        return InterviewSerializer

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        result_display = {
            'SUCCESS': 'Успешно',
            'FAILURE': 'Неуспешно',
            'PENDING': 'Ожидает'
        }.get(instance.result, instance.result)
        status_display = {
            'SCHEDULED': 'Запланировано',
            'COMPLETED': 'Проведено',
            'CANCELLED': 'Отменено'
        }.get(instance.status, instance.status)
        if instance.status == 'COMPLETED':
            job_type_display = instance.get_job_type_display() if instance.resume_type == 'JOB' else instance.get_practice_type_display()
            message = f'Собеседование на {instance.get_resume_type_display()} ({job_type_display}) завершено. Результат: {result_display}.'
            email_template = 'emails/interview_result_success.html' if instance.result == 'SUCCESS' else 'emails/interview_result_failure.html'
            email_subject = 'Результат вашего собеседования'
            email_context = {
                'user': instance.candidate.user,
                'resume_type': instance.get_resume_type_display(),
                'vacancy_name': job_type_display,
                'result': result_display,
                'comment': instance.comment or 'Отсутствует'
            }
            if instance.result == 'SUCCESS':
                message += ' Пожалуйста, загрузите необходимые документы.'
                email_context['document_instructions'] = 'Пожалуйста, загрузите необходимые документы в вашем личном кабинете.'
            else:
                message += ' К сожалению, вы нам не подходите.'
            Notification.objects.create(
                user=instance.candidate.user,
                message=message,
                type='INTERVIEW',
                sent_to_email=True
            )
            send_notification_email(
                subject=email_subject,
                template_name=email_template,
                context=email_context,
                recipient_list=[instance.candidate.user.email]
            )
        logger.info(f"Interview {instance.id} updated: result={instance.result}, candidate={instance.candidate.id}, has_successful_interview={instance.candidate.has_successful_interview}")
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my(self, request):
        try:
            candidate = Candidate.objects.get(user=request.user)
            interviews = Interview.objects.filter(candidate=candidate)
            serializer = InterviewSerializer(interviews, many=True)
            return Response(serializer.data)
        except Candidate.DoesNotExist:
            return Response({'error': 'Кандидат не найден'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated, IsAdminUser])
    def create_interview(self, request):
        serializer = InterviewCreateSerializer(data=request.data)
        if serializer.is_valid():
            interview = serializer.save()
            vacancy_name = interview.get_job_type_display() if interview.resume_type == 'JOB' else interview.get_practice_type_display()
            Notification.objects.create(
                user=interview.candidate.user,
                message=f'Назначено собеседование на {interview.get_resume_type_display()} ({vacancy_name}) на {interview.scheduled_at.strftime("%d.%m.%Y %H:%M")} с сотрудником {interview.employee.user.last_name} {interview.employee.user.first_name}',
                type='INTERVIEW',
                sent_to_email=True
            )
            send_notification_email(
                subject='Назначено собеседование',
                template_name='emails/interview_notification.html',
                context={
                    'user': interview.candidate.user,
                    'resume_type': interview.get_resume_type_display(),
                    'vacancy_name': vacancy_name,
                    'scheduled_at': interview.scheduled_at.strftime("%d.%m.%Y %H:%M"),
                    'employee_name': f"{interview.employee.user.last_name} {interview.employee.user.first_name}"
                },
                recipient_list=[interview.candidate.user.email]
            )
            return Response(InterviewSerializer(interview).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsAdminUser])
    def available_candidates(self, request):
        candidates = Candidate.objects.filter(resumes__status='ACCEPTED').distinct()
        serializer = CandidateSerializer(candidates, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsAdminUser])
    def available_employees(self, request):
        employees = Employee.objects.all()
        serializer = EmployeeSerializer(employees, many=True)
        return Response(serializer.data)

class DocumentViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentSerializer

    def get_queryset(self):
        if self.request.user.is_staff:
            return Document.objects.all()
        return Document.objects.filter(interview__candidate__user=self.request.user)

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        interview_id = request.query_params.get('interview')
        if interview_id:
            queryset = queryset.filter(interview_id=interview_id)
            logger.info(f"Filtered documents for interview {interview_id}: {queryset.count()} documents")
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def create(self, request):
        try:
            candidate = Candidate.objects.get(user=request.user)
            resume_type = request.data.get('resume_type')
            if not resume_type:
                return Response({'error': 'Не указан тип заявки (resume_type)'}, status=status.HTTP_400_BAD_REQUEST)
            
            interview = Interview.objects.filter(
                candidate=candidate, 
                result='SUCCESS', 
                resume_type=resume_type
            ).first()
            logger.info(f"DocumentViewSet.create: Candidate {candidate.id}, resume_type={resume_type}, has_successful_interview={candidate.has_successful_interview}, found interview={interview.id if interview else None}")
            logger.info(f"Request data: {request.data}")
            if not interview:
                return Response(
                    {'error': f'У вас нет успешного собеседования для {resume_type.lower()}'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
        except Candidate.DoesNotExist:
            return Response({'error': 'Кандидат не найден'}, status=status.HTTP_404_NOT_FOUND)

        serializer = DocumentSerializer(data=request.data, context={'interview': interview})
        if serializer.is_valid():
            try:
                document = serializer.save(interview=interview)
                DocumentHistory.objects.create(
                    document=document,
                    status=document.status,
                    comment='Документ загружен'
                )
                vacancy_name = interview.get_job_type_display() if interview.resume_type == 'JOB' else interview.get_practice_type_display()
                Notification.objects.create(
                    user=interview.candidate.user,
                    message=f'Ваш документ ({document.document_type}) для {interview.get_resume_type_display()} ({vacancy_name}) успешно загружен.',
                    type='DOCUMENT',
                    sent_to_email=False
                )
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            except IntegrityError as e:
                logger.error(f"IntegrityError: {str(e)}")
                return Response(
                    {'error': f'Документ типа {request.data.get("document_type")} уже загружен для этого собеседования'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        logger.error(f"Serializer errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated, IsAdminUser])
    def status(self, request, pk=None):
        document = self.get_object()
        status = request.data.get('status')
        comment = request.data.get('comment', '')
        if status not in ['ACCEPTED', 'REJECTED']:
            return Response({'error': 'Недопустимый статус'}, status=status.HTTP_400_BAD_REQUEST)
        document.status = status
        document.comment = comment
        document.save()
        DocumentHistory.objects.create(
            document=document,
            status=document.status,
            comment=document.comment
        )
        vacancy_name = document.interview.get_job_type_display() if document.interview.resume_type == 'JOB' else document.interview.get_practice_type_display()
        Notification.objects.create(
            user=document.interview.candidate.user,
            message=f'Статус вашего документа ({document.document_type}) для {document.interview.get_resume_type_display()} ({vacancy_name}) изменен на "{document.get_status_display()}". Комментарий: {comment or "Отсутствует"}',
            type='DOCUMENT',
            sent_to_email=True
        )
        send_notification_email(
            subject='Изменение статуса документа',
            template_name='emails/document_notification.html',
            context={
                'user': document.interview.candidate.user,
                'document_type': document.document_type,
                'resume_type': document.interview.get_resume_type_display(),
                'vacancy_name': vacancy_name,
                'status': document.get_status_display(),
                'comment': comment or 'Отсутствует'
            },
            recipient_list=[document.interview.candidate.user.email]
        )
        return Response(DocumentSerializer(document).data)

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated, IsAdminUser])
    def history(self, request, pk=None):
        document = self.get_object()
        history = DocumentHistory.objects.filter(document=document).order_by('-created_at')
        serializer = DocumentHistorySerializer(history, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated, IsAdminUser])
    def notify_missing(self, request):
        interview_id = request.data.get('interview_id')
        missing_types = request.data.get('missing_types', [])
        try:
            interview = Interview.objects.get(id=interview_id)
            vacancy_name = interview.get_job_type_display() if interview.resume_type == 'JOB' else interview.get_practice_type_display()
            message = f'Необходимо загрузить следующие документы для {interview.get_resume_type_display()} ({vacancy_name}): {", ".join(missing_types)}.'
            Notification.objects.create(
                user=interview.candidate.user,
                message=message,
                type='DOCUMENT',
                sent_to_email=True
            )
            send_notification_email(
                subject='Необходимы дополнительные документы',
                template_name='emails/document_notification.html',
                context={
                    'user': interview.candidate.user,
                    'message': message
                },
                recipient_list=[interview.candidate.user.email]
            )
            return Response({'message': 'Уведомление отправлено'}, status=status.HTTP_200_OK)
        except Interview.DoesNotExist:
            return Response({'error': 'Собеседование не найдено'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated, IsAdminUser])
    def reject_candidate(self, request):
        interview_id = request.data.get('interview_id')
        try:
            interview = Interview.objects.get(id=interview_id)
            candidate = interview.candidate
            candidate.has_successful_interview = False
            candidate.save()
            interview.result = 'FAILURE'
            interview.save()
            Document.objects.filter(interview=interview).delete()
            vacancy_name = interview.get_job_type_display() if interview.resume_type == 'JOB' else interview.get_practice_type_display()
            message = f'Ваша кандидатура на {interview.get_resume_type_display()} ({vacancy_name}) была окончательно отклонена. Для повторной попытки необходимо пройти собеседование заново.'
            Notification.objects.create(
                user=candidate.user,
                message=message,
                type='HIRE',
                sent_to_email=True
            )
            send_notification_email(
                subject='Статус вашей заявки',
                template_name='emails/hire_status.html',
                context={
                    'user': candidate.user,
                    'application_type': interview.get_resume_type_display().lower(),
                    'vacancy_name': vacancy_name,
                    'status': 'Отклонено',
                    'message': 'Для повторной попытки необходимо пройти собеседование заново.'
                },
                recipient_list=[candidate.user.email]
            )
            return Response({'message': 'Кандидат отклонен'}, status=status.HTTP_200_OK)
        except Interview.DoesNotExist:
            return Response({'error': 'Собеседование не найдено'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated, IsAdminUser])
    def confirm_hire(self, request):
        interview_id = request.data.get('interview_id')
        hire_date_str = request.data.get('hire_date')
        custom_message = request.data.get('message')
        try:
            interview = Interview.objects.get(id=interview_id, result='SUCCESS')
            documents = Document.objects.filter(interview=interview)
            candidate = interview.candidate
            resume_type = interview.resume_type
            is_male = candidate.user.gender == 'MALE'

            if resume_type == 'JOB':
                required_types = [
                    'Паспорт',
                    'Аттестат/Диплом',
                    'Справка с психодиспансера',
                    'Справка с наркодиспансера',
                    'Справка о несудимости',
                    'Согласие на обработку персональных данных',
                    'ИНН',
                    'СНИЛС'
                ]
                if is_male:
                    required_types.append('Приписное/Военник')
            else:
                required_types = [
                    'Паспорт',
                    'Аттестат/Диплом',
                    'Согласие на обработку персональных данных',
                    'Договор о практике',
                    'Заявление на практике'
                ]

            uploaded_types = [doc.document_type for doc in documents]
            missing_types = [t for t in required_types if t not in uploaded_types]
            if missing_types:
                return Response({'error': f'Отсутствуют документы: {", ".join(missing_types)}'}, status=status.HTTP_400_BAD_REQUEST)
            if not all(doc.status == 'ACCEPTED' for doc in documents if doc.document_type in required_types):
                return Response({'error': 'Все обязательные документы должны быть приняты'}, status=status.HTTP_400_BAD_REQUEST)

            if resume_type == 'JOB' and not interview.job_type:
                return Response({'error': 'Тип работы не указан для собеседования'}, status=status.HTTP_400_BAD_REQUEST)

            hire_date = timezone.now().date()
            if hire_date_str:
                try:
                    hire_date = datetime.strptime(hire_date_str, '%Y-%m-%d').date()
                except ValueError:
                    return Response({'error': 'Неверный формат даты. Используйте ГГГГ-ММ-ДД'}, status=status.HTTP_400_BAD_REQUEST)

            vacancy_name = interview.get_job_type_display() if resume_type == 'JOB' else interview.get_practice_type_display()
            if resume_type == 'JOB':
                try:
                    Employee.objects.get(user=candidate.user)
                    return Response({'error': 'Пользователь уже является сотрудником'}, status=status.HTTP_400_BAD_REQUEST)
                except Employee.DoesNotExist:
                    job_type_display = vacancy_name or 'Сотрудник'
                    Employee.objects.create(
                        user=candidate.user,
                        department='Не указано',
                        position=job_type_display,
                        hire_date=hire_date
                    )
                    message = custom_message or f'Поздравляем! Ваш прием на работу ({job_type_display}) назначен на {hire_date.strftime("%d.%m.%Y")}.'
                    email_status = f'День приёма в ООО "Газпром информ"'
                    email_template = 'emails/hire_confirmation.html'
                    email_context = {
                        'user': candidate.user,
                        'application_type': 'работу',
                        'vacancy_name': job_type_display,
                        'status': email_status,
                        'hire_date': hire_date.strftime("%d.%m.%Y")
                    }
            else:
                practice_type_display = vacancy_name or 'Практика'
                message = custom_message or f'Поздравляем! Ваш прием на {practice_type_display} практику назначен на {hire_date.strftime("%d.%m.%Y")}.'
                email_status = f'Приняты на {practice_type_display} практику'
                email_template = 'emails/hire_confirmation.html'
                email_context = {
                    'user': candidate.user,
                    'application_type': 'практику',
                    'vacancy_name': practice_type_display,
                    'status': email_status,
                    'hire_date': hire_date.strftime("%d.%m.%Y")
                }

            candidate.has_successful_interview = False
            candidate.save()
            Notification.objects.create(
                user=candidate.user,
                message=message,
                type='HIRE',
                sent_to_email=True
            )
            send_notification_email(
                subject='День приёма в ООО "Газпром информ"',
                template_name=email_template,
                context=email_context,
                recipient_list=[candidate.user.email]
            )
            return Response({'message': f'Кандидат успешно принят на {resume_type.lower()}'}, status=status.HTTP_200_OK)
        except Interview.DoesNotExist:
            return Response({'error': 'Собеседование не найдено'}, status=status.HTTP_404_NOT_FOUND)

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)