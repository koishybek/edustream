# EduStream

EdTech + consulting platform for **ESG / sustainability education** (Kazakhstan & Central Asia, expanding internationally). Mobile-first, multilingual (RU / EN / KZ).

A **real, runnable** slice of the core learning loop — courses are **free**:

> Register/login → onboarding → browse catalog → open course → **enroll (free)** → watch real (YouTube) lessons → **pass each module's quiz** → track progress → review. Plus a minimal web admin.

## Monorepo layout

| Package | Stack | What it is |
|---|---|---|
| [`backend/`](backend/) | NestJS + Prisma + PostgreSQL | The API. Versioned under `/api/v1`. Single source of truth for mobile **and** admin. |
| [`mobile/`](mobile/) | React + Vite **PWA** (TanStack Query, React Router, axios) | The student app — installable PWA. Feature-first, i18n (ru/en/kz). |
| [`admin/`](admin/) | Next.js (App Router) + TypeScript + Tailwind | Minimal web admin for course CRUD + stats. Hits the same `/api/v1`. |
| [`infra/`](infra/) | docker-compose + scripts | Local PostgreSQL (Docker) **or** a no-Docker local cluster helper. |

## Prerequisites

- **Node.js ≥ 20** (tested on 22.x) — backend + admin.
- **PostgreSQL 16/17** — via Docker (`infra/docker-compose.yml`) **or** a local install (`infra/` helper scripts).
- _(mobile is a PWA — no native SDK needed; Node covers it.)_

## Quick start (this machine — no Docker)

A self-contained local PostgreSQL 17 cluster is provisioned on **port 5433** (no password, trust auth). See [`infra/README.md`](infra/README.md) to start/stop it.

```bash
# 1. Database (if not already running) — see infra/README.md
#    Listening on localhost:5433, database "edustream".

# 2. Backend API
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate       # apply migrations to the dev DB
npm run db:seed              # demo data (idempotent): real videos + quizzes
npm run start:dev            # → http://localhost:4000/api/v1
curl http://localhost:4000/api/v1/health

# 3. Admin (separate terminal)
cd admin
npm install
npm run dev                  # → http://localhost:3000

# 4. Mobile PWA (separate terminal)
cd mobile
npm install
npm run dev                  # → http://localhost:5173
```

## Demo accounts (after `npm run db:seed`)

| Role | Email | Password |
|---|---|---|
| Student | `student@demo.io` | `Student123!` |
| Admin | `admin@demo.io` | `Admin123!` |
| Instructor | `elena@demo.io` | `Instructor123!` |

The demo student is pre-enrolled in *The Architecture of Circular Economies* with module 1's lessons complete and its quiz still pending — so the video → quiz → progress loop is ready to demo.

## With Docker (any machine)

```bash
cd infra
docker compose up -d         # PostgreSQL on localhost:5432
# then set backend/.env DATABASE_URL to the docker connection string (see backend/.env.example)
```

## Build status

Built **phase by phase**; each phase runs end-to-end before the next.

- ✅ **Phase 0 — Scaffold:** monorepo, infra, NestJS `/api/v1/health` (Prisma-connected), mobile PWA themed skeleton, admin login shell.
- ✅ **Phase 1 — Auth + onboarding:** full data model + migration + seed; JWT auth (register/login/refresh/me), roles; PWA login/register/onboarding/profile with token refresh, auth-gated routing, RU/EN/KZ locale switcher.
- ✅ **Phase 2 — Catalog:** `GET /courses` search/filter/sort/pagination, course detail (curriculum + reviews), filters sheet, real Home.
- ✅ **Phase 3 — Learning (free):** free idempotent enrollment, My Learning, **YouTube video player**, **module-end quizzes that gate progress**, progress recompute over lessons + quizzes.
- ✅ **Phase 4 — Admin:** dashboard stats, course CRUD (modules/lessons editor), users table — role-guarded.
- ✅ **Phase 5 — Complete:** students leave/update a course **review** (stars + comment) from the app; a **course-completion screen** ("Курс пройден") with a 🎓 seal, shown at 100% and linked from My Learning.

## Learning model

- **Free courses.** Enrollment is one tap; there is no payment layer.
- **Real video.** Lessons play real YouTube content (TED / TED-Ed / Ellen MacArthur Foundation) via a privacy-friendly embed; direct-file URLs still fall back to a native player.
- **Module quizzes.** Each module ends in a multiple-choice quiz. A module is complete only when its lessons are watched **and** its quiz is passed (default pass mark 60%). Course completion requires every quiz passed.
- **Progress** = (completed lessons + passed quizzes) ÷ (all lessons + all quizzes).

## Conventions

- API errors use a consistent envelope: `{ "error": { "code", "message", "details?" } }`.
- Lists are paginated: `{ "data", "page", "pageSize", "total" }`.
- Secrets via `.env` only (never committed); every package ships an `.env.example`.

## Tests

```bash
cd backend && npm run test:e2e   # auth + catalog + learning/quiz e2e (29 tests)
cd mobile  && npx tsc --noEmit   # student app typecheck
cd admin   && npx tsc --noEmit   # admin typecheck
```
