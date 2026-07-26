"""
Thread-local context to capture the current request user / IP
for use inside model signals.
"""
import threading

_local = threading.local()


def set_audit_user(user):
    _local.user = user


def get_audit_user():
    return getattr(_local, "user", None)


def set_audit_ip(ip):
    _local.ip = ip


def get_audit_ip():
    return getattr(_local, "ip", None)
