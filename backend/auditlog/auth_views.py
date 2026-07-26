"""
Auth views that log login / logout activity into the audit trail.
"""
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from accounts.models import User
from .models import ActivityLog


def _client_ip(request):
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    return xff.split(",")[0].strip() if xff else request.META.get("REMOTE_ADDR")


class LoggingTokenObtainPairView(TokenObtainPairView):
    """Token endpoint that records successful and failed login attempts."""

    def post(self, request, *args, **kwargs):
        username = (request.data or {}).get("username")
        response = super().post(request, *args, **kwargs)
        ip = _client_ip(request)
        if response.status_code == status.HTTP_200_OK:
            user = User.objects.filter(username=username).first()
            ActivityLog.objects.create(
                user=user,
                action="LOGIN",
                module="auth",
                object_repr=username or "-",
                ip_address=ip,
                timestamp=timezone.now(),
            )
        else:
            ActivityLog.objects.create(
                action="LOGIN_FAILED",
                module="auth",
                object_repr=username or "-",
                ip_address=ip,
                timestamp=timezone.now(),
            )
        return response


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    ActivityLog.objects.create(
        user=request.user,
        action="LOGOUT",
        module="auth",
        object_repr=request.user.username,
        ip_address=_client_ip(request),
        timestamp=timezone.now(),
    )
    return Response({"detail": "Déconnexion enregistrée."})
