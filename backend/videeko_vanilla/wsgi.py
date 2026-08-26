"""
WSGI config for Vintsy project.
"""
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'videeko_vanilla.settings')
application = get_wsgi_application()
