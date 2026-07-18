# Netlify deployment (frontend)

CargoBridge’s **React/Vite app** deploys to Netlify. The **Django API** must run on a separate host (Railway, Render, Fly.io, VPS, etc.) — Netlify does not run Django.

## 1. API host (before Netlify)

Deploy `backend/` with PostgreSQL and set at least:

```env
DJANGO_DEBUG=False
DJANGO_SECRET_KEY=<strong-secret>
DJANGO_ALLOWED_HOSTS=<api-hostname>
CORS_ALLOWED_ORIGINS=https://<your-site>.netlify.app,https://<custom-domain-if-any>
DJANGO_SECURE_SSL_REDIRECT=True
# DB_* credentials…
ALLOW_DATA_RESET=False
```

API base path must be reachable as `https://<api-host>/api/` (same as local).

## 2. Netlify site

- **Build command:** `pnpm run build` (from `netlify.toml`)
- **Publish directory:** `dist`
- **Node:** 20 (set in `netlify.toml`)

### Environment variable (required)

| Name | Example |
|------|---------|
| `VITE_API_URL` | `https://api.example.com/api` |

Must include the `/api` suffix. Builds on Netlify **fail** if this is missing (avoids shipping localhost).

Set it under **Site configuration → Environment variables** for Production (and Preview if you want preview deploys to hit a staging API).

### SPA routing

`netlify.toml` and `public/_redirects` already rewrite `/*` → `/index.html` so React Router paths (`/goods`, `/t/:token`, `/scanner`, …) work on refresh.

## 3. After deploy checklist

1. Open the Netlify URL → login page loads.
2. Login against the production API (CORS errors mean `CORS_ALLOWED_ORIGINS` is wrong).
3. Generate a goods QR → URL uses the Netlify origin (`/t/{uuid}`).
4. Camera on Scanner needs HTTPS (Netlify provides this).

## 4. Local vs production

| | Local | Netlify |
|--|--------|---------|
| Frontend | `pnpm run dev` → `http://127.0.0.1:3025` | HTTPS site |
| API | `python manage.py runserver 8001` | Your API host |
| Env | `.env` with `VITE_API_URL=http://127.0.0.1:8001/api` | UI-only `VITE_API_URL` |
