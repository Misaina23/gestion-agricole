"""
Signals that automatically record create / update / delete actions
for the main business models into the ActivityLog.
"""
from django.db.models.signals import pre_save, post_save, post_delete
from django.dispatch import receiver
from .models import ActivityLog
from .context import get_audit_user, get_audit_ip

# Models tracked for automatic history logging.
TRACKED_MODELS = [
    "producers.Producer",
    "producers.Cooperative",
    "parcels.Parcel",
    "productions.Production",
    "deliveries.Delivery",
    "inputs.InputDistribution",
    "inputs.InputType",
    "campaigns.Campaign",
    "inspections.Inspection",
    "accounts.User",
]

# Fields that should never be stored in the log.
_SKIP_FIELDS = {"password"}


def _snapshot(instance):
    data = {}
    for field in instance._meta.fields:
        if field.name in _SKIP_FIELDS:
            continue
        try:
            value = getattr(instance, field.attname, None)
        except Exception:
            continue
        if value is None:
            data[field.name] = None
        elif isinstance(value, (str, int, float, bool)):
            data[field.name] = value
        else:
            data[field.name] = str(value)
    return data


def _repr(instance):
    for attr in ("__str__", "name", "code", "username", "full_name"):
        if hasattr(instance, attr):
            try:
                val = getattr(instance, attr)
                if callable(val):
                    val = val()
                if val:
                    return str(val)
            except Exception:
                pass
    return f"{instance._meta.verbose_name} #{getattr(instance, 'pk', '?')}"


@receiver(pre_save)
def _capture_old_state(sender, instance, **kwargs):
    if not getattr(instance, "pk", None):
        return
    label = f"{sender._meta.app_label}.{sender._meta.object_name}"
    if label not in TRACKED_MODELS:
        return
    try:
        old = sender.objects.filter(pk=instance.pk).first()
        instance._audit_old = _snapshot(old) if old else None
    except Exception:
        instance._audit_old = None


@receiver(post_save)
def _log_save(sender, instance, created, **kwargs):
    label = f"{sender._meta.app_label}.{sender._meta.object_name}"
    if label not in TRACKED_MODELS:
        return
    if getattr(instance, "_audit_skip", False):
        return

    new_value = _snapshot(instance)
    old_value = getattr(instance, "_audit_old", None)
    action = "CREATE" if created else "UPDATE"
    if not created and old_value == new_value:
        return

    ActivityLog.objects.create(
        user=get_audit_user(),
        action=action,
        module=sender._meta.app_label,
        object_repr=_repr(instance),
        object_id=str(getattr(instance, "pk", "")),
        old_value=old_value,
        new_value=new_value if action == "CREATE" else {k: v for k, v in new_value.items() if old_value is None or old_value.get(k) != v},
        ip_address=get_audit_ip(),
    )


@receiver(post_delete)
def _log_delete(sender, instance, **kwargs):
    label = f"{sender._meta.app_label}.{sender._meta.object_name}"
    if label not in TRACKED_MODELS:
        return
    ActivityLog.objects.create(
        user=get_audit_user(),
        action="DELETE",
        module=sender._meta.app_label,
        object_repr=_repr(instance),
        object_id=str(getattr(instance, "pk", "")),
        old_value=getattr(instance, "_audit_old", None) or _snapshot(instance),
        new_value=None,
        ip_address=get_audit_ip(),
    )
