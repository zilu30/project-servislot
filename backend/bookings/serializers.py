from rest_framework import serializers
from .models import Booking, Timeslot


class TimeslotSerializer(serializers.ModelSerializer):
    class Meta:
        model = Timeslot
        fields = ['id', 'date', 'start_time', 'end_time', 'is_booked']


class BookingSerializer(serializers.ModelSerializer):
    service          = serializers.CharField(source='service.title')
    service_id       = serializers.IntegerField(source='service.id')
    price            = serializers.DecimalField(source='service.price', max_digits=10, decimal_places=2)
    provider         = serializers.CharField(source='provider.username')
    provider_company = serializers.CharField(source='provider.company_name', read_only=True)
    provider_id      = serializers.IntegerField(source='provider.id')
    client           = serializers.CharField(source='client.username')
    client_email     = serializers.EmailField(source='client.email')
    date             = serializers.DateField(source='slot.date')
    time             = serializers.TimeField(source='slot.start_time')
    end_time         = serializers.TimeField(source='slot.end_time')
    slot_id          = serializers.IntegerField(source='slot.id')

    class Meta:
        model = Booking
        fields = [
            'id', 'service', 'service_id', 'price', 'provider', 'provider_company', 'provider_id',
            'client', 'client_email', 'date', 'time', 'end_time',
            'slot_id', 'status', 'notes', 'created_at',
        ]
