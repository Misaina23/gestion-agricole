"""Temporary settings used only to verify the seed locally against SQLite."""
import os
from videeko_vanilla.settings import *  # noqa: F401,F403

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": os.path.join(BASE_DIR, "seed_test_tmp.sqlite3"),
    }
}
