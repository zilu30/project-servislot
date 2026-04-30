from django.urls import path
from .views import (
    create_booking,
    reschedule_booking,
    set_availability,
    set_recurring_availability,
    auto_extend_schedule,
    get_available_slots,
    cancel_booking,
    complete_booking,
    CustomerBookingListView,
    ProviderBookingListView,
)

urlpatterns = [
    path('create-booking/', create_booking, name='create-booking'),
    path('reschedule-booking/', reschedule_booking, name='reschedule-booking'),
    path('set-availability/', set_availability, name='set-availability'),
    path('set-recurring-availability/', set_recurring_availability, name='set-recurring-availability'),
    path('auto-extend-schedule/', auto_extend_schedule, name='auto-extend-schedule'),
    path('available-slots/', get_available_slots, name='available-slots'),
    path('cancel-booking/', cancel_booking, name='cancel-booking'),
    path('complete-booking/', complete_booking, name='complete-booking'),
    path('my-bookings/', CustomerBookingListView.as_view(), name='my-bookings'),
    path('provider-bookings/', ProviderBookingListView.as_view(), name='provider-bookings'),
]

