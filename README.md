# EduStream

EdTech + consulting platform for **ESG / sustainability education** (Kazakhstan & Central Asia, expanding internationally). Mobile-first, multilingual (RU / EN / KZ).

This is a **real, runnable MVP slice** of the core learning loop:

> Register/login → onboarding → browse catalog → open course → buy → watch lessons → track progress → review. Plus a minimal web admin.

## Monorepo layout

| Package | Stack | What it is |
|---|---|---|
| [`backend/`](backend/) | NestJS + Prisma + PostgreSQL | The API. Versioned under `/api/v1`. Single source of truth for mobile **and** admin. |
| [`mobile/`](mobile/) | Flutter + Riverpod + GoRouter + dio | The student app. Feature-first architecture, ARB i18n (ru/en/kz). |
| [`admin/`](admin/) | Next.js (App Router) + TypeScript + Tailwind | Minimal web admin for course CRUD + stats. Hits the same `/api/v1`. |
| [`infra/`](infra/) | docker-compose + scripts | Local PostgreSQL (Docker) **or** a no-Docker local cluster helper. |

Plain folders — no JS monorepo tool (Flutter doesn't fit one). Each package has its own README and install steps.

## Prerequisites

- **Node.js ≥ 20** (tested on 22.x) — backend + admin.
- **PostgreSQL 16/17** — via Docker (`infra/docker-compose.yml`) **or** a local install (`infra/` helper scripts).
- **Flutter (stable, Dart 3)** — mobile app. [Install guide.](https://docs.flutter.dev/get-started/install)

## Quick start (this machine — no Docker)

A self-contained local PostgreSQL 17 cluster is already provisioned on **port 5433** (no password, trust auth) using the bundled `pg_ctl`. See [`infra/README.md`](infra/README.md) to start/stop it.

```bash
# 1. Database (if not already running) — see infra/README.md
#    Listening on localhost:5433, database "edustream".

# 2. Backend API
cd backend
npm install
npm run prisma:generate
npm run prisma:push          # creates tables in the dev DB
npm run start:dev            # → http://localhost:4000/api/v1
curl http://localhost:4000/api/v1/health

# 3. Admin (separate terminal)
cd admin
npm install
npm run dev                  # → http://localhost:3000

# 4. Mobile (separate terminal, needs Flutter SDK)
cd mobile
flutter pub get
flutter run                  # pick a device/emulator
```

## With Docker (any machine)

```bash
cd infra
docker compose up -d         # PostgreSQL on localhost:5432
# then set backend/.env DATABASE_URL to the docker connection string (see backend/.env.example)
```

## Build status

Built **phase by phase**; each phase runs end-to-end before the next starts.

- ✅ **Phase 0 — Scaffold:** monorepo, infra, NestJS `/api/v1/health` (Prisma-connected), Flutter themed skeleton, admin login shell.
- ⬜ Phase 1 — Auth + onboarding
- ⬜ Phase 2 — Catalog
- ⬜ Phase 3 — Purchase + learning
- ⬜ Phase 4 — Admin

## Conventions

- Money as **integer cents**; default currency `KZT`.
- API errors use a consistent envelope: `{ "error": { "code", "message", "details?" } }`.
- Lists are paginated: `{ "data", "page", "pageSize", "total" }`.
- Secrets via `.env` only (never committed); every package ships an `.env.example`.
