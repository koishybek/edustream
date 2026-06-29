# EduStream — Backend (NestJS + Prisma)

The API. Everything (mobile + admin) talks to this. All routes are versioned under **`/api/v1`**.

## Stack

- **NestJS 10** (TypeScript), **Prisma 6** ORM, **PostgreSQL 16/17**
- `class-validator` / `class-transformer` for DTO validation
- Global validation pipe, consistent error envelope, CORS for admin + mobile

## Setup

```bash
npm install
cp .env.example .env          # then edit DATABASE_URL if needed
npm run prisma:generate       # generate the Prisma client
npm run prisma:migrate        # apply migrations to the dev DB
npm run db:seed               # demo data (idempotent)
```

### Demo accounts (after seed)

| Role | Email | Password |
|---|---|---|
| Student (pre-enrolled, 50%) | `student@demo.io` | `Student123!` |
| Admin | `admin@demo.io` | `Admin123!` |
| Instructor | `elena@demo.io` | `Instructor123!` |

### Database

You need a reachable PostgreSQL. Two options (see [`../infra/README.md`](../infra/README.md)):

- **No Docker (this machine):** a local PG 17 cluster runs on **`localhost:5433`** (db `edustream`, user `postgres`, no password). `.env` already points here.
- **Docker:** `cd ../infra && docker compose up -d` → PG on `localhost:5432`. Switch `DATABASE_URL` to the docker string in `.env.example`.

## Run

```bash
npm run start:dev             # watch mode → http://localhost:4000/api/v1
# or
npm run start                 # one-shot
npm run build && npm run start:prod
```

Verify:

```bash
curl http://localhost:4000/api/v1/health
# { "status":"ok", "service":"edustream-api", "version":"0.1.0", "database":"up", "timestamp":"..." }
```

## API

| Endpoint | Auth | Notes |
|---|---|---|
| `GET /api/v1/health` | — | DB ping |
| `POST /api/v1/auth/register` | — | → tokens + user (role STUDENT) |
| `POST /api/v1/auth/login` | — | → tokens + user |
| `POST /api/v1/auth/refresh` | refresh token | → new access token |
| `GET /api/v1/auth/me` | access token | current user |
| `PATCH /api/v1/auth/me` | access token | name / locale / interests / knowledgeLevel |

Catalog, purchase, learning and admin endpoints arrive in Phases 2–4.

## Test

```bash
npm test                      # Jest unit tests
npm run test:e2e              # auth flow against the dev DB (9 tests)
```

## Layout

```
src/
  main.ts                     # bootstrap: global prefix, validation, error filter, CORS
  app.module.ts               # root module
  common/filters/             # http-exception.filter.ts → error envelope
  prisma/                     # global PrismaService + module
  health/                     # GET /api/v1/health (pings the DB)
prisma/
  schema.prisma               # data model (Phase 0: placeholder; full model in Phase 1)
```

## Conventions

- Money as **integer cents**; default currency `KZT`.
- Errors: `{ "error": { "code", "message", "details?" }, "path", "timestamp" }`.
- Lists (Phase 2+): `{ "data", "page", "pageSize", "total" }`, `pageSize ≤ 50`.
- No raw SQL strings — Prisma only. Secrets via `.env`.
