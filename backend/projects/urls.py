"""
URLs for Projects App
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProjectViewSet, ProjectActivityViewSet, BeneficiaryViewSet

router = DefaultRouter()
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'project-activities', ProjectActivityViewSet, basename='project-activity')
router.register(r'beneficiaries', BeneficiaryViewSet, basename='beneficiary')

urlpatterns = router.urls