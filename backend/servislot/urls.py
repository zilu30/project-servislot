from django.contrib import admin
from django.urls import path, include
from accounts.views import CustomTokenView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),

    # auth — CustomTokenView wraps the standard JWT view to also return role/email
    path('api/token/',         CustomTokenView.as_view(),    name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(),   name='token_refresh'),

    # app routes — each app owns its own urls.py
    path('api/',          include('accounts.urls')),
    path('api/',          include('bookings.urls')),
    path('api/services/', include('services.urls')),
]
