"""
ASGI config for VIDEEKO VANILLA project.
"""
import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'videeko_vanilla.settings')
application = get_asgi_application()
