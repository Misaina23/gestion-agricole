"""
Django settings for Vintsy project.
"""

import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv


load_dotenv()


BASE_DIR = Path(__file__).resolve().parent.parent


# SECURITY

SECRET_KEY = os.getenv(
    "DJANGO_SECRET_KEY",
    "django-insecure-vintsy-dev-key-change-in-production"
)

DEBUG = os.getenv("DEBUG", "True").lower() == "true"


ALLOWED_HOSTS = os.getenv(
    "ALLOWED_HOSTS",
    "localhost,127.0.0.1,0.0.0.0,gestion-agricole-1-ajdy.onrender.com"
).split(",")


API_URL = os.getenv(
    "API_URL",
    "https://gestion-agricole-1-ajdy.onrender.com/api"
)


# APPLICATIONS

INSTALLED_APPS = [

    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "django_filters",

    "core",
    "accounts",
    "producers",
    "parcels",
    "productions",
    "inspections",
    "ai_assistant",
    "notifications",
    "campaigns",
    "cultures",
    "inputs",
    "projects",
    "tasks",
    "finance",
    "documents",
    "trainings",
    "alerts",
    "workflows",
    "weather",
    "phytosanitary",
    "certifications",
    "auditlog",
    "cin_scans",
]


# MIDDLEWARE

MIDDLEWARE = [

    "django.middleware.security.SecurityMiddleware",

    "whitenoise.middleware.WhiteNoiseMiddleware",

    "corsheaders.middleware.CorsMiddleware",

    "django.contrib.sessions.middleware.SessionMiddleware",

    "django.middleware.common.CommonMiddleware",

    "django.middleware.csrf.CsrfViewMiddleware",

    "django.contrib.auth.middleware.AuthenticationMiddleware",

    "auditlog.middleware.AuditMiddleware",

    "django.contrib.messages.middleware.MessageMiddleware",

    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]


ROOT_URLCONF = "videeko_vanilla.urls"


TEMPLATES = [

    {
        "BACKEND":
        "django.template.backends.django.DjangoTemplates",

        "DIRS": [],

        "APP_DIRS": True,

        "OPTIONS": {

            "context_processors": [

                "django.template.context_processors.debug",

                "django.template.context_processors.request",

                "django.contrib.auth.context_processors.auth",

                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]


WSGI_APPLICATION = "videeko_vanilla.wsgi.application"



# ==============================
# DATABASE RENDER POSTGRESQL
# ==============================


DATABASES = {

    "default": {

        "ENGINE":
        "django.db.backends.postgresql",

        "NAME":
        os.getenv("DB_NAME"),

        "USER":
        os.getenv("DB_USER"),

        "PASSWORD":
        os.getenv("DB_PASSWORD"),

        "HOST":
        os.getenv("DB_HOST"),

        "PORT":
        os.getenv("DB_PORT"),
    }
}


DATABASES["default"].setdefault(
    "OPTIONS",
    {}
)

DATABASES["default"]["OPTIONS"].setdefault(
    "client_encoding",
    "UTF8"
)



DEFAULT_CHARSET = "utf-8"



AUTH_PASSWORD_VALIDATORS = [

    {
        "NAME":
        "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
    },

    {
        "NAME":
        "django.contrib.auth.password_validation.MinimumLengthValidator"
    },

    {
        "NAME":
        "django.contrib.auth.password_validation.CommonPasswordValidator"
    },

    {
        "NAME":
        "django.contrib.auth.password_validation.NumericPasswordValidator"
    },
]


AUTH_USER_MODEL = "accounts.User"



LANGUAGE_CODE = "fr-fr"

TIME_ZONE = "Indian/Antananarivo"

USE_I18N = True

USE_TZ = True



# STATIC

STATIC_URL = "static/"

STATIC_ROOT = BASE_DIR / "staticfiles"


STATICFILES_STORAGE = (
    "whitenoise.storage.CompressedManifestStaticFilesStorage"
)



# MEDIA

MEDIA_URL = "media/"

MEDIA_ROOT = BASE_DIR / "media"



DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"



# REST FRAMEWORK

REST_FRAMEWORK = {

    "DEFAULT_AUTHENTICATION_CLASSES": [

        "auditlog.auth.AuditAuthentication",

        "rest_framework_simplejwt.authentication.JWTAuthentication",

        "rest_framework.authentication.SessionAuthentication",
    ],


    "DEFAULT_PERMISSION_CLASSES": [

        "rest_framework.permissions.IsAuthenticated",
    ],


    "DEFAULT_FILTER_BACKENDS": [

        "django_filters.rest_framework.DjangoFilterBackend",

        "rest_framework.filters.SearchFilter",

        "rest_framework.filters.OrderingFilter",
    ],


    "DEFAULT_PAGINATION_CLASS":

    "rest_framework.pagination.PageNumberPagination",


    "PAGE_SIZE": 4,


    "DEFAULT_RENDERER_CLASSES": [

        "rest_framework.renderers.JSONRenderer",
    ],
}



# JWT

SIMPLE_JWT = {

    "ACCESS_TOKEN_LIFETIME":
    timedelta(hours=12),

    "REFRESH_TOKEN_LIFETIME":
    timedelta(days=7),

    "ROTATE_REFRESH_TOKENS":
    True,

    "BLACKLIST_AFTER_ROTATION":
    True,

    "AUTH_HEADER_TYPES":
    ("Bearer",),
}



# CORS

CORS_ALLOWED_ORIGINS = os.getenv(
    "CORS_ALLOWED_ORIGINS",
    ""
).split(",")


CORS_ALLOW_CREDENTIALS = True


if DEBUG:

    CORS_ALLOW_ALL_ORIGINS = True



# CSRF

CSRF_TRUSTED_ORIGINS = os.getenv(
    "CSRF_TRUSTED_ORIGINS",
    ""
).split(",")



# LOGGING

LOGGING = {

    "version": 1,

    "disable_existing_loggers": False,

    "handlers": {

        "console": {

            "class":
            "logging.StreamHandler",
        },
    },


    "root": {

        "handlers":
        ["console"],

        "level":
        "INFO",
    },


    "loggers": {

        "django": {

            "handlers":
            ["console"],

            "level":
            os.getenv(
                "DJANGO_LOG_LEVEL",
                "INFO"
            ),

            "propagate":
            False,
        },
    },
}