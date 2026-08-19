"""
URL Configuration for Producers App
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProducerViewSet, CooperativeViewSet
from .mobile_views import MobileProducerViewSet

router = DefaultRouter()
router.register(r'', ProducerViewSet, basename='producer')
router.register(r'cooperatives', CooperativeViewSet, basename='cooperative')

urlpatterns = [
    path('', include(router.urls)),
    path('export/', ProducerViewSet.as_view({'get': 'export'})),
    path('<int:pk>/activate/', ProducerViewSet.as_view({'post': 'activate'}), name='producer-activate'),
    path('mobile/pending/', MobileProducerViewSet.as_view({'get': 'pending'})),
    path('mobile/sync/', MobileProducerViewSet.as_view({'post': 'sync'})),
]
