from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = (
        ('customer', 'Customer'),
        ('provider', 'Provider'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='customer')

    # provider fields 
    company_name  = models.CharField(max_length=255, blank=True, null=True)
    phone_number  = models.CharField(max_length=20, blank=True, null=True)
    category      = models.CharField(max_length=100, blank=True, null=True)

    # used on the frontend for working hours
    working_hours = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"{self.username} ({self.role})"
