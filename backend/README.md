# CargoBridge Backend

Django 4.2 + Django REST Framework + PostgreSQL + JWT authentication.

## Setup

1. Start PostgreSQL (Docker):

```bash
docker compose up -d
```

2. Create a virtual environment and install dependencies:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
```

3. Copy environment file and adjust if needed:

```bash
copy .env.example .env
```

4. Run migrations and start the server:

```bash
python manage.py migrate
python manage.py runserver
```

API base URL: `http://localhost:8000/api` (or `8001` if you start with that port)

Health check: `GET /api/health/`

## Auth (login-only)

Public self-registration is **disabled**. Provision users with the management command or Django admin.

```bash
# Create org + china admin (seeds demo data for the new org)
python manage.py create_user --username china --email china@example.com ^
  --password "StrongPass1!" --role china_admin --org-name "CargoBridge"

# Add algeria admin to the same org (use the org UUID printed above)
python manage.py create_user --username algeria --email algeria@example.com ^
  --password "StrongPass1!" --role algeria_admin --org-id <ORG_UUID>
```

Endpoints:

- `POST /api/auth/token/` — obtain JWT access/refresh tokens (throttled)
- `POST /api/auth/token/refresh/` — refresh access token (rotates refresh; throttled)
- `POST /api/auth/logout/` — blacklist refresh token (authenticated)
- `GET /api/auth/me/` — current user profile
- `PATCH /api/auth/me/` — update company name fields; role changes are admin-only

## Role-Based Access

Both roles can read organization data. Unsafe writes are restricted by API permissions:

- `china_admin`: suppliers, agents, goods setup, purchase orders, templates, currencies, documents, reset data
- `algeria_admin`: supplier payments and supplier balance adjustments
- shared: communications, tasks, ratings, calculator records, conversion history, notifications

Shipment status updates are also role-gated: China Admin handles outbound states, Algeria Admin handles arrival/delivery states.

## Frontend

Set `VITE_API_URL=http://127.0.0.1:8001/api` in the project root `.env` if the API runs on 8001.

For local demos that need Settings → Reset data, set `ALLOW_DATA_RESET=True` in `backend/.env`.

Production / Netlify: see [`NETLIFY.md`](../NETLIFY.md) — set `VITE_API_URL` and add the Netlify origin to `CORS_ALLOWED_ORIGINS`.
