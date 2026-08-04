import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
# Prefer backend/.env, then repo-root .env (local / docker).
load_dotenv(BASE_DIR / '.env')
load_dotenv(BASE_DIR.parent / '.env')
load_dotenv()

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'dev-insecure-cargobridge-key')
# Production posture: DEBUG defaults False; set DJANGO_DEBUG=True explicitly for local.
DEBUG = os.environ.get('DJANGO_DEBUG', 'False').lower() in ('1', 'true', 'yes')
ALLOWED_HOSTS = [h.strip() for h in os.environ.get('DJANGO_ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',') if h.strip()]

if not DEBUG and SECRET_KEY == 'dev-insecure-cargobridge-key':
    raise RuntimeError('DJANGO_SECRET_KEY must be set when DJANGO_DEBUG is false.')

DB_NAME = os.environ.get('DB_NAME', 'CargoDZ')
DB_USER = os.environ.get('DB_USER', 'Taki_CargoDZ')
DB_PASSWORD = os.environ.get('DB_PASSWORD', '')
DB_HOST = os.environ.get('DB_HOST', 'localhost')
DB_PORT = os.environ.get('DB_PORT', '5432')

if not DEBUG and not DB_PASSWORD:
    raise RuntimeError('DB_PASSWORD must be set when DJANGO_DEBUG is false.')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'accounts',
    'api',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'api.middleware.ActivityRequestMetaMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'cargobridge.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'cargobridge.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': DB_NAME,
        'USER': DB_USER,
        'PASSWORD': DB_PASSWORD,
        'HOST': DB_HOST,
        'PORT': DB_PORT,
    }
}

# Must never change after the first production migrate.
AUTH_USER_MODEL = 'accounts.User'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'django-static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Production: set CORS_ALLOWED_ORIGINS to your real frontend HTTPS origin(s)
# (e.g. https://cargobridgedz.com). Same-origin Contabo can keep defaults empty of extras.
CORS_ALLOWED_ORIGINS = [
    o.strip()
    for o in os.environ.get(
        'CORS_ALLOWED_ORIGINS',
        'http://localhost:3025,http://127.0.0.1:3025,https://localhost:3025,https://127.0.0.1:3025',
    ).split(',')
    if o.strip()
]
CORS_ALLOW_CREDENTIALS = True

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_THROTTLE_CLASSES': (
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ),
    'DEFAULT_THROTTLE_RATES': {
        'anon': os.environ.get('DRF_ANON_THROTTLE_RATE', '60/min'),
        'user': os.environ.get('DRF_USER_THROTTLE_RATE', '600/min'),
        'login': os.environ.get('DRF_LOGIN_THROTTLE_RATE', '10/min'),
        'refresh': os.environ.get('DRF_REFRESH_THROTTLE_RATE', '30/min'),
        'register': os.environ.get('DRF_REGISTER_THROTTLE_RATE', '5/min'),
        'password_reset': os.environ.get('DRF_PASSWORD_RESET_THROTTLE_RATE', '5/min'),
    },
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 500,
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(
        minutes=int(os.environ.get('JWT_ACCESS_TOKEN_MINUTES', '30')),
    ),
    'REFRESH_TOKEN_LIFETIME': timedelta(
        days=int(os.environ.get('JWT_REFRESH_TOKEN_DAYS', '7')),
    ),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}

SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SECURE_SSL_REDIRECT = os.environ.get('DJANGO_SECURE_SSL_REDIRECT', str(not DEBUG)).lower() in ('1', 'true', 'yes')
SECURE_HSTS_SECONDS = int(os.environ.get('DJANGO_SECURE_HSTS_SECONDS', '0' if DEBUG else '31536000'))
SECURE_HSTS_INCLUDE_SUBDOMAINS = not DEBUG
SECURE_HSTS_PRELOAD = not DEBUG
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# Destructive org data wipe + reseed (Settings UI). Keep False in production.
ALLOW_DATA_RESET = os.environ.get('ALLOW_DATA_RESET', 'False').lower() in ('1', 'true', 'yes')

# Cap bootstrap payloads so large orgs do not OOM/timeout (use list APIs for the rest).
BOOTSTRAP_MAX_PER_COLLECTION = int(os.environ.get('BOOTSTRAP_MAX_PER_COLLECTION', '2000'))

# Auth email (console backend in development)
EMAIL_BACKEND = os.environ.get(
    'EMAIL_BACKEND',
    'django.core.mail.backends.console.EmailBackend' if DEBUG else 'django.core.mail.backends.smtp.EmailBackend',
)
EMAIL_HOST = os.environ.get('EMAIL_HOST', 'localhost')
EMAIL_PORT = int(os.environ.get('EMAIL_PORT', '587'))
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')
EMAIL_USE_TLS = os.environ.get('EMAIL_USE_TLS', 'True').lower() in ('1', 'true', 'yes')
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'noreply@cargobridge.local')
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://127.0.0.1:3025')
