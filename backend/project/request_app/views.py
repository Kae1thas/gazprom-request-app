from rest_framework import viewsets
from .models import Candidate, Resume
from .serializers import CandidateSerializer, ResumeSerializer
from rest_framework.permissions import IsAuthenticated

class CandidateViewSet(viewsets.ModelViewSet):
    queryset = Candidate.objects.all()
    serializer_class = CandidateSerializer
    permission_classes = [IsAuthenticated]

class ResumeViewSet(viewsets.ModelViewSet):
    queryset = Resume.objects.all()
    serializer_class = ResumeSerializer
    permission_classes = [IsAuthenticated]