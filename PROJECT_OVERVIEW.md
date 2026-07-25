# CargoBridge — Complete Project Documentation

> A bilingual (Arabic / French) ERP-style platform for managing international shipments and suppliers between **China and Algeria**. It covers goods/shipment tracking, a full supplier-management suite (purchase orders, payments, ledgers, ratings, documents, tasks), agents, QR-based public tracking, multi-currency finance, analytics, and printable receipts/documents.

---

## 1. Business Overview

CargoBridge is a private, **login-only** (no public self-registration) B2B tool used by two cooperating offices:

- **China office** (`china_admin`) — handles sourcing, suppliers, purchase orders, packing, and dispatch.
- **Algeria office** (`algeria_admin`) — handles arrival, warehouse, customs clearance, and final delivery.

Both admin roles currently share **equal write privileges** across the app; the split mainly expresses *who does what* in the workflow (e.g. "China Office" vs "Algeria Office" is stamped on tracking events) and gates a few workflow stages (customs is Algeria-side).

### Core business capabilities
1. **Shipment/Goods lifecycle** — from `draft` (purchased) → packed → shipped (at sea) → arrived → warehouse → delivered, with a strict state machine, full audit trail, and per-event GPS/photos/office stamping.
2. **QR tracking** — every shipment gets a QR code linking to a **public tracking page** (`/t/:token`); authenticated staff can also advance status directly from a scan.
3. **Customs clearance** — a separate state machine (`not_started` → `pending` → `held`/`cleared`) only usable once goods reach Algeria-side stages.
4. **Supplier management** — supplier profiles, products/catalog, price history, ratings, documents, communications, and follow-up tasks.
5. **Finance** — purchase orders and payments in **any currency**, converted to an organization **base currency** via FX snapshots, producing per-supplier ledgers/statements and outstanding balances. All money-affecting actions are recorded in an **immutable audit log**.
6. **Agents** — the people who physically carry/deliver goods; reliability scores are auto-computed from delivery outcomes.
7. **Analytics & performance** — spend analytics, supplier performance, dashboards.
8. **Tools** — currency converter and shipment/profit/landed-cost calculators.
9. **Bilingual UI** — Arabic (RTL) and French, switchable at runtime.

---

## 2. Technology Stack

### Frontend
| Concern | Technology |
|---|---|
| Language | TypeScript |
| Framework | React 18 |
| Build tool | Vite 6 |
| Routing | React Router 7 (`createBrowserRouter`) |
| State | Zustand 5 (with `persist` middleware) |
| Styling | Tailwind CSS 4 (`@tailwindcss/vite`) |
| UI primitives | Radix UI, MUI (`@mui/material`), custom `ui/` components |
| Icons | lucide-react, MUI icons |
| Charts | Recharts |
| Animation | `motion` |
| Toasts | `sonner` |
| QR | `qrcode.react` (generate), `qr-scanner` (scan) |
| Forms | `react-hook-form` |
| Package manager | pnpm 10.29.2 |

### Backend
| Concern | Technology |
|---|---|
| Language | Python |
| Framework | Django 4.2 |
| API | Django REST Framework (DRF) |
| Auth | `djangorestframework-simplejwt` (JWT access/refresh + token blacklist) |
| CORS | `django-cors-headers` |
| Env | `python-dotenv` |
| WSGI | `cargobridge.wsgi` |

### Database
- **PostgreSQL** (engine `django.db.backends.postgresql`).
- Default local DB name `CargoDZ`, user `Taki_CargoDZ`, host `localhost`, port `5432` (overridable via env).
- Primary keys are **UUIDs** across almost all domain models.

### Hosting model
- **Frontend** → Netlify (static SPA build in `dist/`).
- **Backend (Django)** → a separate host (Render / Railway / Fly.io / VPS). **Netlify does not run Django.**

---

## 3. Repository Structure

```
CargoBridge/
├── backend/                     # Django project
│   ├── cargobridge/             # Project config (settings, urls, wsgi)
│   ├── accounts/                # Auth, Organization, UserProfile, JWT views
│   │   └── management/commands/create_user.py
│   ├── api/                     # All business domain models + API
│   │   ├── models.py            # Full data model
│   │   ├── serializers.py
│   │   ├── views.py             # ViewSets + custom actions
│   │   ├── services.py          # Business logic (state machines, FX, balances)
│   │   ├── constants.py         # Status flows, role caps, HS/incoterm rules
│   │   ├── permissions.py       # Role-based write permission
│   │   ├── signals.py           # Balance/stat recompute triggers
│   │   ├── receipt_templates.py
│   │   ├── migrations/
│   │   ├── management/commands/ # seed_demo, rebalance_suppliers, etc.
│   │   └── tests/               # Integrity/concurrency/workflow tests
│   ├── manage.py
│   └── .env                     # Local backend secrets (DB, JWT, CORS)
│
├── src/                         # React/Vite frontend
│   ├── main.tsx                 # Entry
│   ├── app/
│   │   ├── App.tsx
│   │   ├── routes.tsx           # Route table
│   │   └── components/
│   │       ├── auth/            # AuthGuard, GuestGuard
│   │       ├── layout/          # Root, Header, Sidebar
│   │       ├── pages/           # One component per screen
│   │       ├── quick-create/    # Inline "quick add" modals
│   │       └── ui/              # Reusable UI primitives
│   ├── store/                   # Zustand stores (authStore, appStore)
│   ├── services/                # One API client module per domain
│   ├── lib/                     # apiClient, apiBase, currencies, flows, roles
│   ├── locales/                 # ar.ts, fr.ts, index.ts (i18n)
│   ├── types/                   # Shared TypeScript types
│   └── utils/
│
├── dist/                        # Build output (published by Netlify)
├── public/_redirects           # SPA fallback for Netlify
├── netlify.toml                 # Netlify build + headers + redirects
├── NETLIFY.md                   # Deployment guide
├── vite.config.ts
├── package.json
└── .env                         # Frontend env (VITE_API_URL)
```

---

## 4. Data Model (Database Schema)

All domain tables inherit `OrgModel`, giving every row: `id` (UUID PK), `organization` (FK → `accounts.Organization`), `created_at`, `updated_at`. This enforces **multi-tenant isolation** — every query is filtered by the caller's organization.

### 4.1 Accounts / Tenancy (`accounts` app)
- **Organization** — `id` (UUID), `name`, `name_fr`, `created_at`. The tenant boundary.
- **UserProfile** — one-to-one with Django `User`; fields: `organization` (FK), `role` (`china_admin` | `algeria_admin`). Users authenticate with the standard Django `User` (username/password).

### 4.2 Shipments (`api` app)
- **Agent** — carrier/deliverer. Fields include `name`/`name_fr`, `phone`, `passport`, `country`, `status` (active/traveling/delivered/delayed/inactive), and auto-computed `reliability_score`, `total_deliveries`, `delayed_deliveries`. Unique per org on `passport` and on `phone`.
- **Goods** — the shipment. Rich set of fields:
  - Identity: `tracking_number` (unique per org), `description`(+`_fr`), `category`, `quantity`, `weight`, `photos` (JSON).
  - Workflow: `status` (see §5.1), `priority`, `transport_type` (air/sea/land/express/other), `agent` (FK, nullable).
  - Dates: `departure_date`, `expected_arrival_date`, `arrival_date`.
  - Finance/customs: `value`(+`value_currency`), `hs_code`, `incoterm`, `freight_cost`, `insurance_cost`, `duty_amount`, `duty_rate`, `customs_status`.
  - Soft-delete: `is_deleted`, `deleted_by`, `deleted_at`.
- **GoodsQrCode** — one-to-one with Goods; holds a unique `token` (UUID) used in the public URL, `is_active`, `created_by`.
- **GoodsTrackingEvent** — append-only status timeline: `from_status`, `to_status`, `user`, `office`, `notes`, `photos`, `latitude`, `longitude`.
- **GoodsCustomsEvent** — append-only customs audit (`from_status`, `to_status`, `user`, `notes`).
- **GoodsScanLog** — logs QR `view` and `status_update` scans (with `device`, status delta).

### 4.3 Suppliers (`api` app)
- **Supplier** — `code` (unique per org), `name`(+`_fr`), location, multiple `phones` (JSON), email/whatsapp/wechat/website, contacts, `categories` (JSON), `preferred_currency`, `lead_time_days`, `minimum_order_qty`, `status` (active/inactive/suspended/blacklisted). Denormalized finance fields: `total_purchased`, `total_paid`, `outstanding`, `balance_currency`. Soft-delete fields.
- **SupplierProduct** — catalog item: `name`, `category`, `sku`, `unit_cost`, `currency`.
- **SupplierCategoryEntity** — bilingual category taxonomy (`name`/`name_fr`, `is_editable`).
- **PurchaseOrder (PO)** — `po_number` (unique per org), `supplier`, dates, `currency`, `fx_rate_to_base` (snapshot), `status` (see §5.2), `linked_shipment` (FK → Goods), `total_amount`, soft-delete + `created_by`.
- **PurchaseOrderItem** — line items: `product_name`, `quantity`, `unit_cost`, `total_cost`.
- **PriceHistoryEntry** — recorded when a PO is `received`; captures `product_name`, `unit_cost`, `currency`, `source_po`.
- **SupplierPayment** — `payment_number` (unique per org), `supplier`, optional `purchase_order`, `amount`, `amount_paid`, `currency`, `fx_rate_to_base`, `payment_method`, `payment_date`, `status`. DB **check constraint**: `0 ≤ amount_paid ≤ amount`.
- **SupplierAdjustment** — manual `credit`/`debit` against a supplier, with amount/currency/FX snapshot and reason.
- **SupplierDocument** — uploaded docs (invoice, contract, bill of lading, etc.) stored as `file_data_url` with metadata + expiry.
- **SupplierCommunication** — logged interactions (call/meeting/email/wechat/whatsapp) with follow-up flags.
- **SupplierTask** — follow-up tasks; can link to a supplier, PO, or payment; `due_date`, `priority`, `status` (pending/completed).
- **SupplierRating** — one-to-one with Supplier; six criteria (quality, communication, delivery_speed, reliability, pricing, flexibility) + computed `overall`.

### 4.4 Finance & Tools (`api` app)
- **Currency** — per-org currency: `code`, `name`(+`_fr`), `symbol`, `rate_to_base`, `is_base`, `is_enabled`, `is_default` (unique per org on `code`).
- **ConversionRecord** — saved currency conversions.
- **CalculatorRecord** — saved calculator results (shipment_cost / profit / basic / landed_cost) with `inputs` (JSON) and `result`.
- **SequenceCounter** — per-org, per-key, per-year counter used to generate PO numbers, payment numbers, tracking numbers atomically.
- **MoneyAuditEvent** — **immutable** audit of money-affecting operations (PO/payment/adjustment/supplier) with `action`, `before`/`after` JSON snapshots, and `user`.

### 4.5 Misc
- **Notification** — bilingual in-app notifications (`type`, `title_ar/fr`, `message_ar/fr`, `read`).
- **DocumentTemplate** / **SupplierDocumentTemplate** — printable receipt/document templates (reception/delivery/general).

---

## 5. Business Logic & Workflows

Central logic lives in `backend/api/constants.py` (rules/flows) and `backend/api/services.py` (enforcement). Frontend mirrors some flow hints in `src/lib/goodsStatusFlow.ts`.

### 5.1 Goods status state machine
```
draft ──▶ assigned ──▶ ready_for_departure ──▶ in_transit ──▶ arrived ──▶ warehouse ──▶ delivered
             │                 │                    │            │            │
             └──── cancelled ◀─┴────────────────────┴─ delayed ◀┘            │
delayed ──▶ in_transit / arrived / warehouse / cancelled                     │
delivered ──▶ warehouse   (audited "reopen" for mistaken delivery)           │
cancelled ──▶ draft       (audited "reopen")                                 │
```
- **Business aliases** (shown to users): `draft`=purchased, `assigned`=packed, `ready_for_departure`=waitingShipment, `in_transit`=atSea, etc.
- Transitions from `assigned` onward **require an assigned agent** (`GOODS_AGENT_REQUIRED_STATUSES`).
- Each transition is validated (`can_transition_goods`), executed under a **row lock** (`select_for_update`), writes a `GoodsTrackingEvent`, optionally a `GoodsScanLog`, stamps the acting **office** (China/Algeria), and re-syncs the agent's stats.
- **History consistency** is enforced: if the latest tracking event doesn't match `goods.status`, updates are blocked until `repair_goods_status_history` is run.

### 5.2 Purchase Order state machine
```
draft ─▶ sent ─▶ confirmed ─▶ in_production ─▶ ready ─▶ shipped ─▶ received
   └────────────── cancelled (from any active state) ; cancelled ─▶ draft (reopen)
```
- On create, a PO may **auto-advance only up to `confirmed`** (`advance_po_along_path`).
- Reaching `received` stamps `received_date` and generates **PriceHistoryEntry** rows.
- Status buckets:
  - `ACTIVE_PO_STATUSES` — all non-cancelled.
  - `ANALYTICS_PO_STATUSES` = `BALANCE_PO_STATUSES` = `confirmed`…`received` (excludes draft/sent). These are the POs that create supplier debt and appear in spend analytics.

### 5.3 Customs state machine (Algeria-side)
```
not_started ─▶ pending ─▶ cleared
                  └─▶ held ─▶ pending / cleared
```
- Only allowed when `goods.status ∈ {arrived, delayed, warehouse, delivered}`.
- Writes an append-only `GoodsCustomsEvent`.

### 5.4 Multi-currency finance (the money engine)
- Each organization has a **base currency** (the `Currency` row with `is_base=True`, default `USD`).
- Every money row (PO, payment, adjustment) stores an **FX snapshot** (`fx_rate_to_base`) at creation so historical totals never drift when rates change later.
- `snapshot_fx_rate` / `to_base_amount` convert amounts to base; a **`MissingFxRateError`** is raised if a currency has no configured rate (money cannot be posted blindly).
- **Payment status is derived from amounts** (`derive_payment_status`): `fully_paid` / `partially_paid` / `overdue` / `pending` — a stale flag never overrides the math.
- **Supplier balance** (`update_supplier_balance`, under row lock):
  ```
  outstanding = Σ(PO totals in BALANCE_PO_STATUSES)  −  Σ(credited payments)  +  net(adjustments)
  ```
  Credits reduce, debits increase. All in base currency.
- **Supplier ledger/statement** (`build_supplier_ledger`) merges POs (debits), payments (credits), and adjustments into a date-sorted running balance — the basis for the Account Statement screen.

### 5.5 Agent reliability
`sync_agent_stats`: `total_deliveries` = non-cancelled goods; `delayed_deliveries` = delayed; `reliability_score = round((total − delayed)/total × 100)` clamped 0–100. Recomputed on every relevant status change.

### 5.6 Numbering
`next_sequence` / `next_tracking_number` allocate org-scoped, year-scoped IDs under `select_for_update` with retry-on-race, producing values like `PO-2026-0007`, and tracking numbers like `CB-2026-101`.

### 5.7 Validation rules
- **HS codes** must match `^(\d{6,10}|\d{4}(\.\d{2}){1,3})$`.
- **Incoterms** restricted to the standard set (EXW, FCA, FOB, CFR, CIF, CPT, CIP, DAP, DPU, DDP).
- Duty can be **suggested** from `value × duty_rate%`.
- **Landed cost** = value + freight + insurance + duty.

---

## 6. Authentication & Authorization

### Flow
1. Frontend `POST /api/auth/token/` with `{username, password}` → returns `{access, refresh}` (JWT).
2. Tokens stored in `localStorage` (`cargobridge_access`, `cargobridge_refresh`).
3. `GET /api/auth/me/` returns the user + profile (role) + organization.
4. On `401`, `apiClient` transparently calls `POST /api/auth/token/refresh/` once and retries; on failure it clears tokens and redirects to login.
5. `POST /api/auth/logout/` **blacklists** the refresh token.

### Config (from `settings.py`)
- Access token lifetime: 30 min (`JWT_ACCESS_TOKEN_MINUTES`).
- Refresh token lifetime: 7 days (`JWT_REFRESH_TOKEN_DAYS`).
- `ROTATE_REFRESH_TOKENS = True`, `BLACKLIST_AFTER_ROTATION = True`.
- **Throttling**: `login` 10/min, `refresh` 30/min, `anon` 60/min, `user` 600/min.
- Default DRF permission: `IsAuthenticated`; pagination `PAGE_SIZE = 500`.

### Roles & write control
- Roles: `china_admin`, `algeria_admin` — currently **equal write privileges** (`BOTH_ADMINS`).
- `RoleWritePermission`: reads (`SAFE_METHODS`) allowed to any authenticated user; writes gated per-viewset/per-action via `allowed_write_roles` / `action_write_roles`.
- Role/company changes via `PATCH /api/auth/me/` are restricted (role changes are forbidden through the API — admin-only).

### User provisioning (no public signup)
Users are created via the management command:
```bash
python manage.py create_user --username <u> --email <e> --password <p> \
  --role china_admin|algeria_admin (--org-name "..." | --org-id <uuid>)
```
Creating with `--org-name` makes a **new organization** and seeds demo data into it (`seed_organization`). Use `--org-id` to join an existing org.

---

## 7. API Surface

Base path: `/api/`. Auth under `/api/auth/`.

### Auth (`accounts`)
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/token/` | Login (get JWT pair) |
| POST | `/api/auth/token/refresh/` | Refresh access token |
| POST | `/api/auth/logout/` | Blacklist refresh token |
| GET/PATCH | `/api/auth/me/` | Current user / update company name |

### System (`api`)
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health/` | Health + DB check (`{"status":"ok","database":true}`) |
| GET | `/api/bootstrap/` | One-shot payload of all org data for app startup (capped by `BOOTSTRAP_MAX_PER_COLLECTION`, default 2000/collection) |
| POST | `/api/reset/` | Destructive org wipe + reseed (only if `ALLOW_DATA_RESET=True`) |
| GET | `/api/track/<uuid:token>/` | **Public** shipment tracking payload |
| POST | `/api/track/<uuid:token>/status/` | Advance status from a scan (auth-gated actions) |

### REST resources (DRF router, all org-scoped, CRUD + custom actions)
`agents`, `goods`, `notifications`, `templates`, `supplier-templates`, `suppliers`, `supplier-products`, `supplier-categories`, `purchase-orders`, `price-history`, `supplier-payments`, `supplier-adjustments`, `supplier-documents`, `supplier-communications`, `supplier-tasks`, `supplier-ratings`, `currencies`, `conversion-records`, `calculator-records`.

Custom actions typically include status transitions (goods/PO/customs), QR generation, and supplier statement/ledger endpoints (implemented on the viewsets in `views.py`).

---

## 8. Frontend Architecture

### Startup & data flow
1. `main.tsx` mounts `App` with the router from `routes.tsx`.
2. **Guards**: `GuestGuard` (login only when logged out), `AuthGuard` (everything else). `/t/:token` is public.
3. After login, `appStore.initializeData()` calls `fetchBootstrap()` (`GET /api/bootstrap/`) and hydrates all domain slices in one round-trip, then individual `services/*` handle subsequent CRUD.

### State management (Zustand)
- **`authStore`** — `login`, `logout`, `loadUser`, token/session state.
- **`appStore`** — the big store: language/theme/role/company, all domain collections (goods, agents, suppliers, POs, payments, etc.), the translation function `t`, and actions. Uses `persist` for UI prefs.

### API client (`src/lib/`)
- **`apiBase.ts`** — `API_BASE` from `import.meta.env.VITE_API_URL` (fallback `http://127.0.0.1:8001/api`); `isApiBaseUnreachableFromBrowser()` warns when the API URL is localhost (used to show the Netlify config banner on the login page).
- **`apiClient.ts`** — `request()` wrapper: injects `Authorization: Bearer`, JSON handling, **auto-refresh on 401**, error message extraction, plus `api.get/getList/post/patch/delete` and `fetchBootstrap()`. Also `caseTransform` maps snake_case ⇄ camelCase between API and UI.
- **`services/*`** — one module per domain (goodsService, supplierService, paymentService, currencyService, etc.) wrapping the client.

### Screens (`components/pages`)
Dashboard, Goods + GoodsDetail, GoodsTrackPage (public), Suppliers + SupplierProfile, PurchaseOrders, Payments, AccountStatement, Agents + AgentProfile, Scanner (QR), Calculator, Settings, TemplatesManager, Tasks, Performance, Analytics, Login.

### Quick-create modals (`components/quick-create`)
Inline "add new" modals (Agent, Supplier, Product, Currency, Task) so users can create related records without leaving the current form (an ERP stay-in-workflow pattern).

### Internationalization
`src/locales/ar.ts` + `fr.ts`, resolved via `createT`. Arabic drives RTL layout (`dir="rtl"`). Language is switchable at runtime (persisted).

---

## 9. Security Posture

- JWT auth with short access tokens, rotating + blacklisted refresh tokens.
- **Multi-tenant isolation**: every queryset filtered by the caller's organization; QR tokens are unguessable UUIDs.
- **Rate limiting** on login/refresh and general endpoints.
- **Immutable money audit** (`MoneyAuditEvent`) and append-only tracking/customs events.
- **Soft deletes** (`is_deleted` + `deleted_by`/`deleted_at`) on financially/operationally sensitive records.
- **Concurrency safety** via `select_for_update` on balances, sequences, and status transitions.
- Production hardening in `settings.py`: `DEBUG` defaults **False**; refuses to boot without `DJANGO_SECRET_KEY` and `DB_PASSWORD` when not in debug; `SECURE_SSL_REDIRECT`, HSTS, secure cookies, `X_FRAME_OPTIONS=DENY`, `nosniff` all enabled outside debug.
- Netlify security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`) in `netlify.toml`.

---

## 10. Configuration & Environment Variables

### Frontend (`.env` / Netlify UI)
| Var | Purpose | Example |
|---|---|---|
| `VITE_API_URL` | Django API base (**must** end in `/api`) | `https://api.example.com/api` |

### Backend (`backend/.env`)
| Var | Purpose |
|---|---|
| `DJANGO_SECRET_KEY` | Django secret (required in prod) |
| `DJANGO_DEBUG` | `True` local, `False`/unset in prod |
| `DJANGO_ALLOWED_HOSTS` | Comma list of API hostnames |
| `DB_NAME/DB_USER/DB_PASSWORD/DB_HOST/DB_PORT` | PostgreSQL connection |
| `CORS_ALLOWED_ORIGINS` | Comma list of allowed frontend origins |
| `JWT_ACCESS_TOKEN_MINUTES` / `JWT_REFRESH_TOKEN_DAYS` | Token lifetimes |
| `DRF_*_THROTTLE_RATE` | Rate limits (anon/user/login/refresh) |
| `ALLOW_DATA_RESET` | Enables destructive org reset endpoint |
| `BOOTSTRAP_MAX_PER_COLLECTION` | Cap on bootstrap payload size |
| `DJANGO_SECURE_SSL_REDIRECT` / `DJANGO_SECURE_HSTS_SECONDS` | TLS hardening |

> **CORS gotcha:** the frontend origin (host:port) must be in `CORS_ALLOWED_ORIGINS`, or the browser blocks API calls (surfacing as a "cannot connect to server" error).

---

## 11. Local Development

### Backend
```bash
cd backend
# ensure PostgreSQL is running and backend/.env is set
python manage.py migrate
python manage.py create_user --username you --email you@x.com --password 'Strong1!' \
  --role china_admin --org-name "CargoBridge"
python manage.py runserver 127.0.0.1:8001
```

### Frontend
```bash
# repo root; .env → VITE_API_URL=http://127.0.0.1:8001/api
pnpm install
pnpm run dev            # serves http://localhost:3025 (vite.config default)
```
Make sure the dev server's origin/port is present in the backend's `CORS_ALLOWED_ORIGINS`.

### Useful management commands (`backend/api/management/commands`)
- `seed_demo` — seed demo data for an org.
- `seed_receipt_templates` — install default document templates.
- `rebalance_suppliers` — recompute all supplier balances.
- `repair_goods_status_history` — fix inconsistent goods status/history.
- `scan_persistence` — QR scan persistence utility.

### Tests (`backend/api/tests`)
Cover finance integrity, concurrency/balance, goods status flow, workflow integrity audit, QR isolation, supplier statements, agents, and admin role parity.

---

## 12. Deployment

### Frontend → Netlify (`netlify.toml`)
- Build: `pnpm run build` → publish `dist/`. Node 20, pnpm 10.29.2.
- SPA fallback: `/* → /index.html 200` (also in `public/_redirects`).
- Security headers + long-lived asset caching configured.
- **Required**: set `VITE_API_URL` in Netlify → Site settings → Environment variables (with `/api`). If unset, build still succeeds but the app falls back to localhost and shows a warning banner — login won't work.

### Backend → separate host
Deploy `backend/` with PostgreSQL; set production env (`DJANGO_DEBUG=False`, strong `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS`, DB creds, and `CORS_ALLOWED_ORIGINS` including the Netlify URL). API must be reachable at `https://<host>/api/`.

See `NETLIFY.md` for the full deployment checklist.

---

## 13. Key Design Decisions (Summary)

- **Org-scoped everything** via a shared `OrgModel` base → clean multi-tenancy.
- **FX snapshots per transaction** → historically accurate financials regardless of later rate changes.
- **Derived money states** (payment status, supplier balance) computed from source amounts, never trusted from stale flags.
- **Strict, auditable state machines** for goods, POs, and customs, with row-locking and append-only event logs.
- **Bootstrap endpoint** for a fast single-request app load, with per-collection caps to protect large tenants.
- **Login-only** product; user/org provisioning is an admin/CLI action, not a public flow.
- **Bilingual-first** (AR/FR) with RTL support throughout.
```
