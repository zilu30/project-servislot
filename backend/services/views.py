from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view
from .models import Service, ServiceSlot, Favorite
from .serializers import ServiceSerializer


@api_view(['GET'])
def get_services(request):
    # display active services only
    services = Service.objects.filter(
        provider__role='provider',
        provider__is_active=True,
    )
    serializer = ServiceSerializer(services, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def get_service_detail(request, pk):
    try:
        service = Service.objects.get(pk=pk)
    except Service.DoesNotExist:
        return Response({"error": "Service not found"}, status=404)
    serializer = ServiceSerializer(service)
    return Response(serializer.data)

# provider views
class ProviderServicesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        services = Service.objects.filter(provider=request.user)
        serializer = ServiceSerializer(services, many=True)
        return Response(serializer.data)

    def post(self, request):
        data = request.data
        try:
            service = Service.objects.create(
                provider=request.user,
                title=data.get('title'),
                description=data.get('description'),
                price=data.get('price'),
                category=data.get('category'),
                address=data.get('address', ''),
                rating=data.get('rating') or None,  # empty string → None
            )
            return Response({"detail": "Success", "id": service.id}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ProviderServiceDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            service = Service.objects.get(pk=pk, provider=request.user)
        except Service.DoesNotExist:
            return Response({"error": "Service not found"}, status=404)

        service.title       = request.data.get('title',       service.title)
        service.description = request.data.get('description', service.description)
        service.price       = request.data.get('price',       service.price)
        service.category    = request.data.get('category',    service.category)
        service.address     = request.data.get('address',     service.address)
        service.rating      = request.data.get('rating') or None
        service.save()
        return Response(ServiceSerializer(service).data)

    def delete(self, request, pk):
        try:
            service = Service.objects.get(pk=pk, provider=request.user)
        except Service.DoesNotExist:
            return Response({"error": "Service not found"}, status=404)
        service.delete()
        return Response({"message": "Service deleted"}, status=204)


# favorites 
class FavoritesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        favs = Favorite.objects.filter(customer=request.user).select_related('service')
        services = [f.service for f in favs]
        return Response(ServiceSerializer(services, many=True).data)

    def post(self, request):
        service_id = request.data.get('service_id')
        try:
            service = Service.objects.get(pk=service_id)
        except Service.DoesNotExist:
            return Response({"error": "Service not found"}, status=404)
        Favorite.objects.get_or_create(customer=request.user, service=service)
        return Response({"status": "added"})


class FavoriteDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, service_id):
        Favorite.objects.filter(customer=request.user, service_id=service_id).delete()
        return Response({"status": "removed"})
