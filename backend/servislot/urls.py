from django.contrib import admin
from django.urls import path, include
from accounts.views import CustomTokenView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
 # app routes 
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/token/',         CustomTokenView.as_view(),    name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(),   name='token_refresh'),
    path('api/',          include('accounts.urls')),
    path('api/',          include('bookings.urls')),
    path('api/services/', include('services.urls')),
]
