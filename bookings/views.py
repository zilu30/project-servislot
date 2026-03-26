from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db import transaction 
from .models import Timeslot, Booking
from .utils import generate_slots
from datetime import datetime

# Create your views here.
@api_view(['POST'])
def create_booking(request):
    user = request.user
    slot_id = request.data.get('slot_id')
    service_id = request.data.get('service_id')

    with transaction.atomic():
        slot = Timeslot.objects.select_for_update().get(id=slot_id)

        if slot.is_booked:
            return Response({"error":"Slot already booked"}, status=400)
        
        slot.is_booked =True
        slot.save()

        booking = Booking.objects.create(
            client= request.user,
            provider=slot.provider,
            service_id=service_id,
            slot=slot,
            status='BOOKED'
        )
    return Response ({"message":"Booking successful", 'booking_id': booking.id})

@api_view(['POST'])
def set_availability(request):
        
    provider = request.user

    date_str = request.data.get('date')
    start_time_str = request.data.get('start_time')
    end_time_str = request.data.get('end_time')

        # Convert strings → proper types
    date = datetime.strptime(date_str, "%Y-%m-%d").date()
    start_time = datetime.strptime(start_time_str, "%H:%M").time()
    end_time = datetime.strptime(end_time_str, "%H:%M").time()

    generate_slots(provider, date, start_time, end_time)

    return Response({"message": "Availability set and slots created"})

@api_view(['GET'])
def get_available_slots(request):
    provider_id = request.GET.get('provider_id')
    date = request.GET.get('date')

    slots = Timeslot.objects.filter(
        provider_id=provider_id,
        date=date,
        is_booked=False
    )

    return Response(slots.values())


@api_view(['POST'])
def cancel_booking(request):
    booking_id = request.data.get('booking_id')

    try:
        booking = Booking.objects.get(id=booking_id)
    except Booking.DoesNotExist:
        return Response({"error": "Booking not found"}, status=404)

    #  Free the slot
    slot = booking.slot
    slot.is_booked = False
    slot.save()

    #  Delete booking
    booking.delete()

    return Response({"message": "Booking cancelled successfully"})