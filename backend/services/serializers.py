from rest_framework import serializers
from django.utils import timezone
from .models import Service, ServiceSlot
from bookings.models import Timeslot

# serializer for service
class ServiceSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceSlot
        fields = ['id', 'date', 'start_time', 'is_booked']


class ServiceSerializer(serializers.ModelSerializer):
    slots            = ServiceSlotSerializer(many=True, read_only=True)
    provider_id      = serializers.IntegerField(source='provider.id', read_only=True)
    provider_username = serializers.CharField(source='provider.username', read_only=True)
    provider_company = serializers.CharField(source='provider.company_name', read_only=True)
    has_availability = serializers.SerializerMethodField()
    city_state       = serializers.SerializerMethodField()

    # check for timeslot availability
    def get_has_availability(self, obj):
        return Timeslot.objects.filter(
            provider=obj.provider,
            date__gte=timezone.now().date(),
            is_booked=False,
        ).exists()
    # city and state 
    def get_city_state(self, obj):
        addr = (obj.address or "").strip()
        if not addr:
            return ""
        parts = [p.strip() for p in addr.split(",")]
        if len(parts) >= 3:
            city      = parts[-2]
            state_zip = parts[-1].split()
            state     = state_zip[0] if state_zip else parts[-1]
            return f"{city}, {state}"
        return addr

    class Meta:
        model = Service
        fields = [
            'id', 'title', 'description', 'price', 'category',
            'provider_id', 'provider_username', 'provider_company',
            'rating', 'has_availability', 'address', 'city_state',
            'slots', 'created_at',
        ]
