# bookings/urls.py
from django.urls import path
from .views import create_booking,set_availability,get_available_slots, cancel_booking

urlpatterns = [
    path('create-booking/', create_booking),
    path('set-availability/', set_availability, name='set-availability'),
    path('available-slots/' , get_available_slots, name='get_available_slots'),
    path('cancel-booking/', cancel_booking),
]