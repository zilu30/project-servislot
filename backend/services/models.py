from django.db import models
from accounts.models import User

# service model
class Service(models.Model):
    provider    = models.ForeignKey(User, on_delete=models.CASCADE, related_name='services')
    title       = models.CharField(max_length=255)
    description = models.TextField()
    price       = models.DecimalField(max_digits=10, decimal_places=2)
    category    = models.CharField(max_length=100)
    rating      = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True)
    address     = models.CharField(max_length=500, blank=True, default="")
    latitude  = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

# slot model
class ServiceSlot(models.Model):
    service    = models.ForeignKey(Service, related_name='slots', on_delete=models.CASCADE)
    date       = models.DateField()
    start_time = models.TimeField()
    is_booked  = models.BooleanField(default=False)

# favorite  model
class Favorite(models.Model):
    customer   = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorites')
    service    = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('customer', 'service')
