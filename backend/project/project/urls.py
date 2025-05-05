from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from request_app.views import CandidateViewSet, ResumeViewSet, RegisterView, MeView, ResumeCreateView, ResumeStatusUpdateView, MyResumesView, ResumeDeleteView, ResumeEditView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

router = DefaultRouter()
router.register(r'candidates', CandidateViewSet)
router.register(r'resumes', ResumeViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/me/', MeView.as_view(), name='me'),
    path('api/resume/create/', ResumeCreateView.as_view(), name='resume-create'),
    path('api/resume/<int:pk>/status/', ResumeStatusUpdateView.as_view(), name='resume-status-update'),
    path('api/my-resumes/', MyResumesView.as_view(), name='my-resumes'),
    path('api/resume/<int:pk>/delete/', ResumeDeleteView.as_view(), name='resume-delete'),
    path('api/resume/<int:pk>/edit/', ResumeEditView.as_view(), name='resume-edit'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]