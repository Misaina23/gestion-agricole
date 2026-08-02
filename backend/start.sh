#!/bin/sh

echo "Running migrations..."
python manage.py migrate

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Loading initial data..."
python manage.py load_initial_data
python manage.py seed_demo_data

echo "Starting Gunicorn..."
gunicorn videeko_vanilla.wsgi:application --bind 0.0.0.0:8000
