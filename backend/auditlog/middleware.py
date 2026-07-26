"""
Middleware that exposes the current request's user and IP
to the audit-logging signals via thread-local storage.
"""
from .context import set_audit_user, set_audit_ip


class AuditMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        user = getattr(request, "user", None)
        set_audit_user(user if (user and getattr(user, "is_authenticated", False)) else None)

        xff = request.META.get("HTTP_X_FORWARDED_FOR")
        ip = xff.split(",")[0].strip() if xff else request.META.get("REMOTE_ADDR")
        set_audit_ip(ip)

        return self.get_response(request)
