from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from .models import User, Candidate, Resume, Employee
from .serializers import CandidateSerializer, ResumeSerializer, UserSerializer, ResumeStatusUpdateSerializer, ResumeEditSerializer
from rest_framework_simplejwt.tokens import RefreshToken

class CandidateViewSet(viewsets.ModelViewSet):
    queryset = Candidate.objects.all()
    serializer_class = CandidateSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]  # Только модераторы (is_staff)

class ResumeViewSet(viewsets.ModelViewSet):
    queryset = Resume.objects.all()
    serializer_class = ResumeSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]  # Только модераторы могут видеть все резюме

class RegisterView(APIView):
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            Candidate.objects.create(user=user)
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': serializer.data,
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

        # Проверяем наличие профиля Candidate
        try:
            candidate = Candidate.objects.get(user=user)
            response_data['candidate'] = CandidateSerializer(candidate).data
        except Candidate.DoesNotExist:
            response_data['candidate'] = None

        # Проверяем наличие профиля Employee
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
            serializer.save(candidate=candidate)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
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
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MyResumesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            candidate = Candidate.objects.get(user=request.user)
            resumes = Resume.objects.filter(candidate=candidate)
            serializer = ResumeSerializer(resumes, many=True)
            return Response(serializer.data)
        except Candidate.DoesNotExist:
            return Response({'error': 'Кандидат не найден'}, status=status.HTTP_404_NOT_FOUND)

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

        serializer = ResumeEditSerializer(resume, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(ResumeSerializer(resume).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)