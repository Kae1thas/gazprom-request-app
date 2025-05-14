from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from django.utils import timezone
from rest_framework.response import Response
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
                serializer.save(candidate=candidate)
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
            message = f'Статус вашего резюме #{resume.id} изменен на: {status_display}'
            if comment:
                message += f'\nКомментарий: {comment}'
            Notification.objects.create(
                user=resume.candidate.user,
                message=message
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
            Notification.objects.create(
                user=interview.candidate.user,
                message=f'Назначено собеседование #{interview.id} на {interview.scheduled_at.strftime("%d.%m.%Y %H:%M")} с сотрудником {interview.employee.user.last_name} {interview.employee.user.first_name}'
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
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Document.objects.all()
        return Document.objects.filter(interview__candidate__user=self.request.user)

    def create(self, request):
        try:
            candidate = Candidate.objects.get(user=request.user)
            interview = Interview.objects.filter(candidate=candidate, result='SUCCESS').first()
            if not interview:
                return Response({'error': 'У вас нет успешного собеседования для загрузки документов'}, status=status.HTTP_403_FORBIDDEN)
        except Candidate.DoesNotExist:
            return Response({'error': 'Кандидат не найден'}, status=status.HTTP_404_NOT_FOUND)

        serializer = DocumentSerializer(data=request.data, context={'interview': interview})
        if serializer.is_valid():
            try:
                document = serializer.save(interview=interview)
                DocumentHistory.objects.create(
                    document=document,
                    status=document.status,
                    comment=document.comment
                )
                Notification.objects.create(
                    user=interview.candidate.user,
                    message=f'Ваш документ #{document.id} ({document.document_type}) успешно загружен.'
                )
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            except IntegrityError as e:
                return Response({'error': f'Ошибка: Документ этого типа уже загружен'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, pk=None):
        try:
            document = Document.objects.get(pk=pk, interview__candidate__user=request.user)
        except Document.DoesNotExist:
            return Response({'error': 'Документ не найден или не принадлежит вам'}, status=status.HTTP_404_NOT_FOUND)

        document.delete()
        Notification.objects.create(
            user=request.user,
            message=f'Ваш документ #{pk} ({document.document_type}) успешно удален.'
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def upload(self, request, pk=None):
        document = self.get_object()
        serializer = DocumentSerializer(document, data=request.data, partial=True)
        if serializer.is_valid():
            document = serializer.save()
            DocumentHistory.objects.create(
                document=document,
                status=document.status,
                comment=document.comment
            )
            Notification.objects.create(
                user=document.interview.candidate.user,
                message=f'Ваш документ #{document.id} ({document.document_type}) успешно обновлен.'
            )
            return Response(serializer.data)
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
        Notification.objects.create(
            user=document.interview.candidate.user,
            message=f'Статус вашего документа #{document.id} ({document.document_type}) изменён на "{document.get_status_display()}". Комментарий: {comment or "Отсутствует"}'
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
            message = f'Необходимо загрузить следующие документы: {", ".join(missing_types)}.'
            Notification.objects.create(
                user=interview.candidate.user,
                message=message
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
            Notification.objects.create(
                user=candidate.user,
                message='Ваша кандидатура была окончательно отклонена. Для повторной попытки необходимо пройти собеседование заново.'
            )
            return Response({'message': 'Кандидат отклонен'}, status=status.HTTP_200_OK)
        except Interview.DoesNotExist:
            return Response({'error': 'Собеседование не найдено'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated, IsAdminUser])
    def confirm_hire(self, request):
        interview_id = request.data.get('interview_id')
        try:
            interview = Interview.objects.get(id=interview_id, result='SUCCESS')
            documents = Document.objects.filter(interview=interview)
            required_types = [
                'Паспорт', 'Приписное/Военник', 'Аттестат/Диплом',
                'Справка с психодиспансера', 'Справка с наркодиспансера',
                'Справка о несудимости', 'Согласие на обработку персональных данных',
                'ИНН', 'СНИЛС'
            ]
            uploaded_types = [doc.document_type for doc in documents]
            missing_types = [t for t in required_types if t not in uploaded_types]
            if missing_types:
                return Response({'error': f'Отсутствуют документы: {", ".join(missing_types)}'}, status=status.HTTP_400_BAD_REQUEST)
            if not all(doc.status == 'ACCEPTED' for doc in documents if doc.document_type in required_types):
                return Response({'error': 'Все обязательные документы должны быть приняты'}, status=status.HTTP_400_BAD_REQUEST)
            candidate = interview.candidate
            Employee.objects.create(
                user=candidate.user,
                department='Не указано',
                position='Не указано',
                hire_date=timezone.now().date()
            )
            candidate.has_successful_interview = False
            candidate.save()
            Notification.objects.create(
                user=candidate.user,
                message='Поздравляем! Вы приняты на работу.'
            )
            return Response({'message': 'Кандидат успешно принят на работу'}, status=status.HTTP_200_OK)
        except Interview.DoesNotExist:
            return Response({'error': 'Собеседование не найдено'}, status=status.HTTP_404_NOT_FOUND)

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)