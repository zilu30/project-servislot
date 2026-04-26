from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Service

@api_view(['GET'])
def get_services(request):
    services = Service.objects.all().values()
    return Response(services)