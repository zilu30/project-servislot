from django.contrib import admin
from .models import Timeslot, Booking, Availability

# Register your models here.
admin.site.register(Timeslot)
admin.site.register(Booking)
admin.site.register(Availability)

