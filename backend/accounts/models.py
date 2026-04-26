from django.contrib.auth.models import AbstractUser
from django.db import models

# models
class User(AbstractUser):
    ROLE_CHOICES  = (
        ('customer', 'Customer'),
        ('PROVIDER', 'Provider'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default= 'customer')