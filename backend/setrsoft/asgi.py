"""
Django ASGI config for setrsoft project.
"""
import os

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'setrsoft.settings')

application = get_asgi_application()
