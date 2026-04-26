from django.urls import path
from .views import CustomTokenView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path("api/token/", CustomTokenView.as_view()),
    path("api/token/refresh/", TokenRefreshView.as_view()),
]