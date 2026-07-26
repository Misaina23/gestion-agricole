"""
DRF authentication class that records the authenticated user into the
thread-local audit context so model signals can attribute actions.
"""
from rest_framework_simplejwt.authentication import JWTAuthentication
from .context import set_audit_user


class AuditAuthentication(JWTAuthentication):
    def authenticate(self, request):
        result = super().authenticate(request)
        if result is not None:
            user, _ = result
            set_audit_user(user)
        return result
