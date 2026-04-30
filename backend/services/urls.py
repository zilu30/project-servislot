from django.urls import path
from .views import (
    get_services, get_service_detail,
    ProviderServicesView, ProviderServiceDetailView,
    FavoritesView, FavoriteDeleteView,
)

urlpatterns = [
    path('', get_services, name='all-services'),
    path('all/', get_services),
    path('<int:pk>/', get_service_detail, name='service-detail'),
    path('my-services/', ProviderServicesView.as_view(), name='provider-services'),
    path('my-services/<int:pk>/', ProviderServiceDetailView.as_view(), name='provider-service-detail'),
    path('favorites/', FavoritesView.as_view(), name='favorites'),
    path('favorites/<int:service_id>/', FavoriteDeleteView.as_view(), name='favorite-delete'),
]
