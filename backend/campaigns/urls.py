"""
URLs for Campaigns App
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CampaignViewSet, CampaignProducerViewSet

router = DefaultRouter()
router.register(r'campaigns', CampaignViewSet, basename='campaign')
router.register(r'campaign-producers', CampaignProducerViewSet, basename='campaign-producer')

urlpatterns = router.urls