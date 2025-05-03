from django.contrib import admin
from django.urls import path
from django.http import JsonResponse

def ping(request):
    return JsonResponse({'message': 'Связь с backend установлена'})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/ping/', ping),  # новый API-эндпоинт
]
