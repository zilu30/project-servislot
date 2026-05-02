from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
from django.core.mail import send_mail
from django.conf import settings
from datetime import datetime
from .models import Timeslot, Booking, RecurringSchedule
from .utils import generate_slots
from .serializers import BookingSerializer, TimeslotSerializer


# email notification

def _send_booking_emails(booking, event):
    """Fire confirmation/notification emails for booked, cancelled, or rescheduled events.
    fail_silently=True so a broken mail config never crashes a booking action."""
    slot     = booking.slot
    date_str = slot.date.strftime('%B %d, %Y')
    time_str = slot.start_time.strftime('%I:%M %p')

    if event == 'booked':
        customer_subject = f'Booking Confirmed – {booking.service.title}'
        customer_body = (
            f'Hi {booking.client.username},\n\n'
            f'Your appointment has been confirmed!\n\n'
            f'Service: {booking.service.title}\n'
            f'Provider: {booking.provider.username}\n'
            f'Date: {date_str}\n'
            f'Time: {time_str}\n\n'
            f'Thank you for using ServiSlot!'
        )
        provider_subject = f'New Booking – {booking.service.title}'
        provider_body = (
            f'Hi {booking.provider.username},\n\n'
            f'You have a new appointment!\n\n'
            f'Service: {booking.service.title}\n'
            f'Client: {booking.client.username} ({booking.client.email})\n'
            f'Date: {date_str}\n'
            f'Time: {time_str}\n\n'
            f'Log in to ServiSlot to view your full schedule.'
        )
    elif event == 'cancelled':
        customer_subject = f'Booking Cancelled – {booking.service.title}'
        customer_body = (
            f'Hi {booking.client.username},\n\n'
            f'Your appointment has been cancelled.\n\n'
            f'Service: {booking.service.title}\n'
            f'Date: {date_str}\n'
            f'Time: {time_str}\n\n'
            f'You can book a new appointment anytime on ServiSlot.'
        )
        provider_subject = f'Booking Cancelled – {booking.service.title}'
        provider_body = (
            f'Hi {booking.provider.username},\n\n'
            f'An appointment has been cancelled.\n\n'
            f'Service: {booking.service.title}\n'
            f'Client: {booking.client.username}\n'
            f'Date: {date_str}\n'
            f'Time: {time_str}\n\n'
            f'The time slot is now available again.'
        )
    elif event == 'rescheduled':
        customer_subject = f'Booking Rescheduled – {booking.service.title}'
        customer_body = (
            f'Hi {booking.client.username},\n\n'
            f'Your appointment has been rescheduled!\n\n'
            f'Service: {booking.service.title}\n'
            f'Provider: {booking.provider.username}\n'
            f'New Date: {date_str}\n'
            f'New Time: {time_str}\n\n'
            f'Thank you for using ServiSlot!'
        )
        provider_subject = f'Booking Rescheduled – {booking.service.title}'
        provider_body = (
            f'Hi {booking.provider.username},\n\n'
            f'An appointment has been rescheduled.\n\n'
            f'Service: {booking.service.title}\n'
            f'Client: {booking.client.username} ({booking.client.email})\n'
            f'New Date: {date_str}\n'
            f'New Time: {time_str}\n\n'
            f'Log in to ServiSlot to view your updated schedule.'
        )
    else:
        return

    from_email = settings.DEFAULT_FROM_EMAIL
    send_mail(customer_subject, customer_body, from_email,
              [booking.client.email], fail_silently=True)
    send_mail(provider_subject, provider_body, from_email,
              [booking.provider.email], fail_silently=True)


# booking actions 

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_booking(request):
    if request.user.role != 'customer':
        return Response({"error": "Only customers can make bookings"}, status=403)

    slot_id    = request.data.get('slot_id')
    service_id = request.data.get('service_id')
    notes      = request.data.get('notes', '')

    if not slot_id or not service_id:
        return Response({"error": "slot_id and service_id are required"}, status=400)

    now = datetime.now().date()

    try:
        slot = Timeslot.objects.get(id=slot_id)
    except Timeslot.DoesNotExist:
        return Response({"error": "Slot not found"}, status=404)

    if slot.date < now:
        return Response({"error": "Cannot book past dates"}, status=400)

    if slot.is_booked:
        return Response({"error": "Slot already booked"}, status=400)

    # double booking check
    with transaction.atomic():
        slot = Timeslot.objects.select_for_update().get(id=slot_id)

        if slot.is_booked:
            return Response({"error": "Slot was just booked by someone else"}, status=400)

        slot.is_booked = True
        slot.save()

        booking = Booking.objects.create(
            client=request.user,
            provider=slot.provider,
            service_id=service_id,
            slot=slot,
            notes=notes,
            status='BOOKED'
        )

    _send_booking_emails(booking, 'booked')

    serializer = BookingSerializer(booking)
    return Response({"message": "Booking successful", "booking": serializer.data}, status=201)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reschedule_booking(request):
    booking_id  = request.data.get('booking_id')
    new_slot_id = request.data.get('new_slot_id')

    if not booking_id or not new_slot_id:
        return Response({"error": "booking_id and new_slot_id are required"}, status=400)

    try:
        booking = Booking.objects.select_related(
            'slot', 'service', 'provider', 'client'
        ).get(id=booking_id, client=request.user)
    except Booking.DoesNotExist:
        return Response({"error": "Booking not found"}, status=404)

    if booking.status == 'CANCELLED':
        return Response({"error": "Cannot reschedule a cancelled booking"}, status=400)

    now = datetime.now().date()

    try:
        new_slot = Timeslot.objects.get(id=new_slot_id)
    except Timeslot.DoesNotExist:
        return Response({"error": "New slot not found"}, status=404)

    if new_slot.date < now:
        return Response({"error": "Cannot reschedule to a past date"}, status=400)

    # locking switching providers
    if new_slot.provider_id != booking.provider_id:
        return Response({"error": "New slot must be with the same provider"}, status=400)
    with transaction.atomic():
        new_slot = Timeslot.objects.select_for_update().get(id=new_slot_id)

        if new_slot.is_booked:
            return Response({"error": "This slot is no longer available"}, status=400)

        old_slot = booking.slot
        old_slot.is_booked = False
        old_slot.save()

        new_slot.is_booked = True
        new_slot.save()

        booking.slot = new_slot
        booking.save()

    booking.refresh_from_db()
    _send_booking_emails(booking, 'rescheduled')

    serializer = BookingSerializer(booking)
    return Response({"message": "Booking rescheduled successfully", "booking": serializer.data})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_booking(request):
    booking_id = request.data.get('booking_id')

    if not booking_id:
        return Response({"error": "booking_id is required"}, status=400)

    try:
        booking = Booking.objects.select_related(
            'slot', 'service', 'provider', 'client'
        ).get(id=booking_id, client=request.user)
    except Booking.DoesNotExist:
        return Response({"error": "Booking not found"}, status=404)

    if booking.status == 'CANCELLED':
        return Response({"error": "Booking is already cancelled"}, status=400)

    booking.status = 'CANCELLED'
    booking.save()

    # slot check
    booking.slot.is_booked = False
    booking.slot.save()

    _send_booking_emails(booking, 'cancelled')

    return Response({"message": "Booking cancelled successfully"})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_booking(request):
    """Provider marks a booking complete or no-show. 'reopen' was removed — left the guard just in case."""
    booking_id = request.data.get('booking_id')

    if not booking_id:
        return Response({"error": "booking_id is required"}, status=400)

    try:
        booking = Booking.objects.select_related(
            'slot', 'service', 'provider', 'client'
        ).get(id=booking_id, provider=request.user)
    except Booking.DoesNotExist:
        return Response({"error": "Booking not found"}, status=404)

    action = request.data.get('action')  

    if booking.status == 'CANCELLED':
        return Response({"error": "Cannot modify a cancelled booking"}, status=400)

    if action == 'complete':
        booking.status = 'COMPLETED'
    elif action == 'no_show':
        booking.status = 'NO_SHOW'
    else:
        return Response({"error": "action must be 'complete' or 'no_show'"}, status=400)

    booking.save()
    serializer = BookingSerializer(booking)
    return Response({"message": f"Booking marked as {booking.status}", "booking": serializer.data})


# booking list views 

class CustomerBookingListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        bookings = Booking.objects.filter(
            client=request.user
        ).select_related('slot', 'service', 'provider', 'client').order_by('-created_at')
        serializer = BookingSerializer(bookings, many=True)
        return Response(serializer.data)


class ProviderBookingListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'provider':
            return Response({"error": "Access denied"}, status=403)

        bookings = Booking.objects.filter(
            provider=request.user
        ).select_related('slot', 'service', 'client', 'provider').order_by('-created_at')
        serializer = BookingSerializer(bookings, many=True)
        return Response(serializer.data)


# availability 

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def set_availability(request):
    """One-off availability for a specific date. Delegates to generate_slots."""
    if request.user.role != 'provider':
        return Response({"error": "Only providers can set availability"}, status=403)

    date_str       = request.data.get('date')
    start_time_str = request.data.get('start_time')
    end_time_str   = request.data.get('end_time')
    slot_duration  = request.data.get('slot_duration', 30)

    if not all([date_str, start_time_str, end_time_str]):
        return Response({"error": "date, start_time, and end_time are required"}, status=400)

    try:
        date          = datetime.strptime(date_str, "%Y-%m-%d").date()
        start_time    = datetime.strptime(start_time_str, "%H:%M").time()
        end_time      = datetime.strptime(end_time_str, "%H:%M").time()
        slot_duration = int(slot_duration)
    except (ValueError, TypeError):
        return Response({
            "error": "Invalid format. Use YYYY-MM-DD for date, HH:MM for times, integer for slot_duration"
        }, status=400)

    if slot_duration < 5 or slot_duration > 480:
        return Response({"error": "slot_duration must be between 5 and 480 minutes"}, status=400)

    if start_time >= end_time:
        return Response({"error": "start_time must be before end_time"}, status=400)

    if date < datetime.now().date():
        return Response({"error": "Cannot set availability for past dates"}, status=400)

    generate_slots(request.user, date, start_time, end_time, duration=slot_duration)
    return Response({"message": "Availability set successfully"})


@api_view(['GET'])
def get_available_slots(request):
    """Public endpoint — customers use this to fetch open slots for a given provider+date."""
    provider_id = request.GET.get('provider_id')
    date        = request.GET.get('date')

    if not provider_id or not date:
        return Response({"error": "provider_id and date are required"}, status=400)

    slots = Timeslot.objects.filter(
        provider_id=provider_id,
        date=date,
        is_booked=False
    ).order_by('start_time')

    serializer = TimeslotSerializer(slots, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def set_recurring_availability(request):
    """Generate slots for every matching weekday in a date range, then save the pattern
    to RecurringSchedule so auto-extend can keep it rolling forward."""
    if request.user.role != 'provider':
        return Response({"error": "Only providers can set availability"}, status=403)

    start_date_str = request.data.get('start_date')
    end_date_str   = request.data.get('end_date')
    days_of_week   = request.data.get('days_of_week', [])   
    start_time_str = request.data.get('start_time')
    end_time_str   = request.data.get('end_time')
    slot_duration  = request.data.get('slot_duration', 30)

    if not all([start_date_str, end_date_str, start_time_str, end_time_str]) or not days_of_week:
        return Response({"error": "start_date, end_date, days_of_week, start_time and end_time are required"}, status=400)

    try:
        from datetime import timedelta
        start_date    = datetime.strptime(start_date_str, "%Y-%m-%d").date()
        end_date      = datetime.strptime(end_date_str,   "%Y-%m-%d").date()
        start_time    = datetime.strptime(start_time_str, "%H:%M").time()
        end_time      = datetime.strptime(end_time_str,   "%H:%M").time()
        slot_duration = int(slot_duration)
        days_of_week  = [int(d) for d in days_of_week]
    except (ValueError, TypeError):
        return Response({"error": "Invalid format. Use YYYY-MM-DD for dates, HH:MM for times."}, status=400)

    if start_date > end_date:
        return Response({"error": "start_date must be before end_date"}, status=400)

    if start_time >= end_time:
        return Response({"error": "start_time must be before end_time"}, status=400)

    if (end_date - start_date).days > 365:
        return Response({"error": "Date range cannot exceed 365 days"}, status=400)

    today = datetime.now().date()
    days_created = 0
    current = start_date

    while current <= end_date:
        if current.weekday() in days_of_week and current >= today:
            generate_slots(request.user, current, start_time, end_time, duration=slot_duration)
            days_created += 1
        current += timedelta(days=1)
    RecurringSchedule.objects.update_or_create(
        provider=request.user,
        defaults={
            'days_of_week':  days_of_week,
            'start_time':    start_time,
            'end_time':      end_time,
            'slot_duration': slot_duration,
            'is_active':     True,
        }
    )

    return Response({"message": f"Availability set for {days_created} days", "days_created": days_created})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def auto_extend_schedule(request):
    """Called on provider dashboard load. If fewer than 14 days of future slots remain,
    extends 30 more days forward so the schedule never runs dry without the provider noticing."""
    if request.user.role != 'provider':
        return Response({"active_through": None})

    try:
        schedule = RecurringSchedule.objects.get(provider=request.user, is_active=True)
    except RecurringSchedule.DoesNotExist:
        return Response({"active_through": None, "extended": False})

    from datetime import timedelta

    today = datetime.now().date()

    last_slot = (
        Timeslot.objects.filter(provider=request.user, date__gte=today)
        .order_by('-date')
        .first()
    )

    last_date = last_slot.date if last_slot else today - timedelta(days=1)

    extended = False
    if last_date <= today + timedelta(days=14):
        extend_from = max(last_date + timedelta(days=1), today)
        extend_to   = today + timedelta(days=44)
        current = extend_from
        days_created = 0

        while current <= extend_to:
            if current.weekday() in schedule.days_of_week:
                generate_slots(
                    request.user, current,
                    schedule.start_time, schedule.end_time,
                    duration=schedule.slot_duration,
                )
                days_created += 1
            current += timedelta(days=1)

        extended = days_created > 0

        last_slot = (
            Timeslot.objects.filter(provider=request.user, date__gte=today)
            .order_by('-date')
            .first()
        )
        last_date = last_slot.date if last_slot else last_date

    return Response({
        "active_through": last_date.strftime("%Y-%m-%d") if last_date >= today else None,
        "extended": extended,
    })
