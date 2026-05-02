from datetime import datetime, timedelta
from .models import Timeslot


def generate_slots(provider, date, start_time, end_time, duration=30):
  # prevents duplicate booking
    Timeslot.objects.filter(provider=provider, date=date, is_booked=False).delete()

    current = datetime.combine(date, start_time)
    end     = datetime.combine(date, end_time)

    while current < end:
        slot_end = current + timedelta(minutes=duration)
        Timeslot.objects.create(
            provider=provider,
            date=date,
            start_time=current.time(),
            end_time=slot_end.time()
        )
        current = slot_end
