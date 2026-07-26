"""
Views for Accounts App
"""
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import get_user_model
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .serializers import (
    UserSerializer,
    UserCreateSerializer,
    UserUpdateSerializer,
    ChangePasswordSerializer,
    RegistrationSerializer,
)

User = get_user_model()


class RegistrationView(generics.CreateAPIView):
    """Public registration endpoint"""
    queryset = User.objects.all()
    serializer_class = RegistrationSerializer
    permission_classes = [AllowAny]


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing users.
    """
    queryset = User.objects.all()
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['role', 'platform', 'registration_status', 'region', 'commune', 'is_active', 'is_field_agent', 'is_supervisor']
    search_fields = ['username', 'first_name', 'last_name', 'email', 'phone']
    ordering_fields = ['created_at', 'last_name', 'role']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserSerializer
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user profile"""
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['put'])
    def update_me(self, request):
        """Update current user profile"""
        serializer = UserUpdateSerializer(
            request.user,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)
    
    @action(detail=False, methods=['post'])
    def change_password(self, request):
        """Change current user password"""
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response(
                {'old_password': 'Mot de passe actuel incorrect.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'message': 'Mot de passe modifie avec succes.'})
    
    @action(detail=False, methods=['get'])
    def agents(self, request):
        """Get all field agents"""
        agents = User.objects.filter(is_field_agent=True, is_active=True)
        serializer = UserSerializer(agents, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def pending_registrations(self, request):
        """Get all pending registrations (for admin/manager)"""
        if not request.user.has_perm('accounts.view_user'):
            return Response(
                {'detail': 'Permission denied.'},
                status=status.HTTP_403_FORBIDDEN
            )
        pending = User.objects.filter(registration_status='pending')
        serializer = UserSerializer(pending, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a user registration"""
        if not request.user.role in ['admin', 'manager']:
            return Response(
                {'detail': 'Seuls les admins et gestionnaires peuvent approuver les inscriptions.'},
                status=status.HTTP_403_FORBIDDEN
            )
        user = self.get_object()
        user.registration_status = 'approved'
        user.is_active = True
        user.save()
        return Response(UserSerializer(user).data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a user registration"""
        if not request.user.role in ['admin', 'manager']:
            return Response(
                {'detail': 'Seuls les admins et gestionnaires peuvent rejeter les inscriptions.'},
                status=status.HTTP_403_FORBIDDEN
            )
        user = self.get_object()
        user.registration_status = 'rejected'
        user.is_active = False
        user.save()
        return Response(UserSerializer(user).data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get user statistics"""
        total = User.objects.count()
        active = User.objects.filter(is_active=True).count()
        agents = User.objects.filter(is_field_agent=True).count()
        
        by_role = {}
        for role, label in User.ROLE_CHOICES:
            by_role[role] = User.objects.filter(role=role).count()
        
        by_platform = {}
        for platform, label in User.PLATFORM_CHOICES:
            by_platform[platform] = User.objects.filter(platform=platform).count()
        
        by_status = {}
        for status_val, label in User.REGISTRATION_STATUS_CHOICES:
            by_status[status_val] = User.objects.filter(registration_status=status_val).count()
        
        return Response({
            'total': total,
            'active': active,
            'inactive': total - active,
            'field_agents': agents,
            'by_role': by_role,
            'by_platform': by_platform,
            'by_status': by_status
        })
