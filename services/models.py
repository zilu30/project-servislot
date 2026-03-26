from django.db import models
from django.conf import settings
# MODELS

User = settings.AUTH_USER_MODEL
class Service( models.Model):
    provider = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    duration = models.IntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
