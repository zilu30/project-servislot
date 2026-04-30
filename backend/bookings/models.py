from django.db import models
from django.conf import settings

User = settings.AUTH_USER_MODEL


class Timeslot(models.Model):
    provider   = models.ForeignKey(User, on_delete=models.CASCADE, related_name='timeslots')
    date       = models.DateField()
    start_time = models.TimeField()
    end_time   = models.TimeField()
    is_booked  = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.date} {self.start_time}–{self.end_time}"
class Booking(models.Model):
    STATUS_CHOICES = (
        ('BOOKED',     'Booked'),
        ('CANCELLED',  'Cancelled'),
        ('COMPLETED',  'Completed'),
        ('NO_SHOW',    'No Show'),
    )

    client   = models.ForeignKey(User, on_delete=models.CASCADE, related_name='client_bookings')
    provider = models.ForeignKey(User, on_delete=models.CASCADE, related_name='provider_bookings')
    service  = models.ForeignKey('services.Service', on_delete=models.CASCADE)

    # OneToOne keeps the constraint simple — one booking per slot, enforced at DB level
    slot = models.OneToOneField(Timeslot, on_delete=models.CASCADE)

    status     = models.CharField(max_length=20, choices=STATUS_CHOICES, default='BOOKED')
    notes      = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Booking #{self.id} — {self.client.username}"


class Availability(models.Model):
    # legacy model — slots are now managed through Timeslot directly
    provider   = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='availability')
    date       = models.DateField()
    start_time = models.TimeField()
    end_time   = models.TimeField()


class RecurringSchedule(models.Model):
    provider      = models.OneToOneField(User, on_delete=models.CASCADE, related_name='recurring_schedule')
    days_of_week  = models.JSONField(default=list)   
    start_time    = models.TimeField()
    end_time      = models.TimeField()
    slot_duration = models.PositiveIntegerField(default=30)
    is_active     = models.BooleanField(default=True)
    updated_at    = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"RecurringSchedule for {self.provider.username}"
