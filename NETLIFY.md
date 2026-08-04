# Netlify deployment (frontend) — optional / legacy

> **Contabo path-based deploy:** prefer same-origin `VITE_API_URL=/api` with nginx proxying `/api/` to Gunicorn. This Netlify + separate-API guide is optional archive documentation only.

CargoBridge deploys as **one Vite/React SPA**: the public marketing site and the authenticated workspace share the same origin and `dist` build. The **Django API** must run on a separate host (Railway, Render, Fly.io, VPS, etc.) — Netlify does not run Django.

| Path | Who |
|------|-----|
| `/`, `/features`, `/pricing`, `/about`, `/faq`, `/contact`, … | Public marketing |
| `/login`, `/register`, password reset | Guests |
| `/dashboard`, `/goods`, `/suppliers`, … | Authenticated app |
| `/t/:token` | Public track page |

Local: one `pnpm run dev` serves the whole product. The `Marketing Website/` folder is **source/archive only** (Figma Make export); production entry is the root app (`src/marketing/` + `src/app/`).

## 1. API host (before Netlify)

Deploy `backend/` with PostgreSQL and set at least:

```env
DJANGO_DEBUG=False
DJANGO_SECRET_KEY=<strong-secret>
DJANGO_ALLOWED_HOSTS=<api-hostname>
CORS_ALLOWED_ORIGINS=https://<your-site>.netlify.app,https://<custom-domain-if-any>
DJANGO_SECURE_SSL_REDIRECT=True
FRONTEND_URL=https://<your-site>.netlify.app
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=...
EMAIL_HOST_USER=...
EMAIL_HOST_PASSWORD=...
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
# DB_* credentials…
ALLOW_DATA_RESET=False
```

API base path must be reachable as `https://<api-host>/api/` (same as local).

Run migrations after deploy:

```bash
python manage.py migrate
python manage.py check_org_fk_integrity
```

## 2. Netlify site

- **Build command:** `pnpm run build` (from `netlify.toml`)
- **Publish directory:** `dist`
- **Node:** 20 (set in `netlify.toml`)

### Environment variable (**required** for production)

| Name | Example |
|------|---------|
| `VITE_API_URL` | `https://api.example.com/api` |

Must include the `/api` suffix. Set it under **Site configuration → Environment variables** for Production (and Preview if needed).

If unset, the **production build fails closed** (no localhost fallback). Local `pnpm run dev` may use relative `/api` via the Vite proxy.

### SPA routing

`netlify.toml` and `public/_redirects` already rewrite `/*` → `/index.html` so React Router paths (`/`, `/dashboard`, `/goods`, `/t/:token`, `/register`, `/reset-password`, …) work on refresh.

## 3. After deploy checklist

1. Open the Netlify URL → marketing home loads; **Connexion** goes to `/login` (same origin).
2. Login → `/dashboard` (app chrome). Logout → `/login`.
3. Register a new company → empty goods/agents (system defaults only); lands on `/dashboard`.
4. Login against the production API (CORS errors mean `CORS_ALLOWED_ORIGINS` is wrong).
5. Password reset email arrives when SMTP is configured.
6. Public QR track does **not** show shipment monetary value anonymously.
7. Generate a goods QR → URL uses the Netlify origin (`/t/{uuid}`).
8. Camera on Scanner needs HTTPS (Netlify provides this).

## 4. Local vs production

| | Local | Netlify |
|--|--------|---------|
| Frontend | `pnpm run dev` → HTTP on localhost (marketing + app) | HTTPS site |
| API | `python manage.py runserver 8011` | Your API host |
| Env | `.env` with `VITE_API_URL=/api` (proxy) or absolute URL | **Required** `VITE_API_URL` |
| Seed | `python manage.py seed_demo --demo` for sample data | Never auto-seed demo on signup |
| Legacy | `Marketing Website/` folder is archive only (do not deploy separately) | — |

## 5. Roles (SaaS RBAC)

- `owner` / `admin` — org settings, invites
- `manager` / `employee` — domain writes
- `readonly` — read only
- `office` (`china` \| `algeria`) — preserves goods/customs office workflow
