from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from request_app.views import (
    RegisterView, MeView, CandidateViewSet, ResumeViewSet,
    ResumeCreateView, ResumeStatusUpdateView, ResumeDeleteView,
    ResumeEditView, NotificationView, InterviewViewSet,
    DocumentViewSet, NotificationViewSet
)
from django.conf import settings
from django.conf.urls.static import static

router = DefaultRouter()
router.register(r'candidates', CandidateViewSet)
router.register(r'resumes', ResumeViewSet)
router.register(r'documents', DocumentViewSet, basename='documents')
router.register(r'interviews', InterviewViewSet, basename='interviews')
router.register(r'notifications', NotificationViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/me/', MeView.as_view(), name='me'),
    path('api/resume/create/', ResumeCreateView.as_view(), name='resume-create'),
    path('api/resume/<int:pk>/status/', ResumeStatusUpdateView.as_view(), name='resume-status'),
    path('api/resume/<int:pk>/edit/', ResumeEditView.as_view(), name='resume-edit'),
    path('api/resume/<int:pk>/delete/', ResumeDeleteView.as_view(), name='resume-delete'),
    path('api/notifications/<int:pk>/', NotificationView.as_view(), name='notification'),
    path('api/', include(router.urls)),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)