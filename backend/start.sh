#!/bin/sh

echo "Running migrations..."
python manage.py migrate

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Synchronizing the real cooperative register..."
# Safe on a restart: this upserts the committed real register without wiping
# data entered after the initial deployment. For a complete rebuild use
# ``python manage.py seed`` explicitly.
python manage.py seed --keep

echo "Starting Gunicorn..."
gunicorn videeko_vanilla.wsgi:application --bind 0.0.0.0:8000
