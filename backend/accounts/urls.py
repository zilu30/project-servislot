from django.urls import path
from .views import MeView, UpdateMeView, SignupView, WorkingHoursView

urlpatterns = [
    path('me/', MeView.as_view(), name='me'),
    path('me/update/', UpdateMeView.as_view(), name='me-update'),
    path('signup/', SignupView.as_view(), name='signup'),
    path('working-hours/', WorkingHoursView.as_view(), name='working-hours'),
]