from rest_framework import serializers
from .models import Booking
from django.urls import path, include

class BookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = '__all__'

urlpatterns = {
    path('api/bookings/', include('bookings.urls')),
}