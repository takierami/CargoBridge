# CargoBridge Backend

Django 4.2 + Django REST Framework + PostgreSQL + JWT authentication.

**Python:** use the version in [`runtime.txt`](runtime.txt) (currently `python-3.12.13`). Check locally with `python --version`.

Requires Python 3.12.x — Django 4.2 LTS does not officially support 3.13.

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

To verify a clean install: `python -m venv .venv-fresh`, activate it, `pip install -r requirements.txt`, then `python manage.py check`.

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

## Auth

Self-serve company registration and password reset are enabled.

```bash
# Create org + owner (system defaults only — no demo shipments)
python manage.py create_user --username owner --email owner@example.com ^
  --password "StrongPass1!" --role owner --office china --org-name "CargoBridge"

# Invite-style: add employee to existing org
python manage.py create_user --username emp --email emp@example.com ^
  --password "StrongPass1!" --role employee --office algeria --org-id <ORG_UUID>

# Optional demo agents/goods for local demos only
python manage.py seed_demo --demo
```

Endpoints:

- `POST /api/auth/register/` — create company + owner (throttled)
- `POST /api/auth/token/` — JWT login (throttled)
- `POST /api/auth/token/refresh/` — refresh access token
- `POST /api/auth/logout/` — blacklist refresh token
- `GET|PATCH /api/auth/me/` — profile / company settings (admins only for company name)
- `POST /api/auth/password-reset/` / `password-reset/confirm/`
- `GET|POST /api/auth/members/` — list / invite (owner & admin)
- `PATCH /api/auth/members/<id>/` — update role/office

## Role-Based Access

- `owner` / `admin` — full org writes + members + company settings
- `manager` / `employee` — domain writes (goods, suppliers, POs, …)
- `readonly` — safe methods only
- `office` (`china` | `algeria`) — preserves goods/customs office workflow

Integrity scan: `python manage.py check_org_fk_integrity`

## Frontend

Set `VITE_API_URL=/api` in the project root (`.env` / `.env.local`). Vite proxies `/api` to Django in local dev; nginx does the same on the VPS.

For local demos that need Settings → Reset data, set `ALLOW_DATA_RESET=True` in `backend/.env`.

Production builds require `VITE_API_URL` at build time (use `/api` for same-origin Contabo). Optional legacy Netlify notes: [`NETLIFY.md`](../NETLIFY.md).
