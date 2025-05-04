from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from request_app.views import CandidateViewSet, ResumeViewSet, RegisterView
from django.http import JsonResponse
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

def ping(request):
    return JsonResponse({'message': 'Связь с backend установлена'})

router = DefaultRouter()
router.register(r'candidates', CandidateViewSet)
router.register(r'resumes', ResumeViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/ping/', ping),
    path('api/', include(router.urls)),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/register/', RegisterView.as_view(), name='register'),
]