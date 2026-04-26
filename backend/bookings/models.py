from django.db import models
from django.conf import settings


# MODELS

User = settings.AUTH_USER_MODEL

class Timeslot(models.Model):
    provider = models.ForeignKey(User, on_delete=models.CASCADE)
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_booked = models.BooleanField(default=False)

class Booking(models.Model):
    client = models.ForeignKey(User, on_delete=models.CASCADE,  related_name= 'client_bookings')
    provider = models.ForeignKey(User, on_delete=models.CASCADE, related_name='provider_bookings')
    service = models.ForeignKey('services.Service', on_delete=models.CASCADE)
    slot = models.OneToOneField(Timeslot, on_delete= models.CASCADE)  # prevents double booking 
    status = models.CharField(max_length=20)

class Availability(models.Model):
    provider = models.ForeignKey('accounts.user', on_delete=models.CASCADE)
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()