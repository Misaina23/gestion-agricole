Development run helper

This file explains how to start the backend locally (Windows PowerShell).

1) Create (or recreate) virtualenv and install requirements:

```powershell
cd backend
./run_dev.ps1
```

The script will create `.venv`, activate it, install `requirements.txt`, run migrations and start the server.

2) Environment variables

Copy `.env.example` to `.env` and set at least:

- `SECRET_KEY`
- `DATABASE_URL` or DB_* variables
- `LLM_API_KEY` if you want to use AI features

3) Quick manual commands (if you prefer manual steps):

```powershell
# create venv
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
# optionally set env vars from .env manually or use a tool
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

4) Notes
- Ensure `requests` is installed (it's included in `requirements.txt`).
- On first run, creating a superuser may be useful: `python manage.py createsuperuser`.
- If using Docker or production, set `LLM_API_KEY` as secure environment variable in your deployment.
