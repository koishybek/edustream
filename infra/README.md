# EduStream — Infra

Local PostgreSQL for the backend. Pick **one** of two paths.

## Option A — Docker (any machine)

```bash
docker compose up -d        # PostgreSQL 16 on localhost:5432
docker compose ps
docker compose down         # stop (keeps data)
docker compose down -v      # stop + wipe data
```

Connection string:

```
postgresql://edustream:edustream@localhost:5432/edustream?schema=public
```

Set this as `DATABASE_URL` in `backend/.env`.

## Option B — Local PostgreSQL, no Docker (Windows)

For machines with PostgreSQL 16/17 installed but no Docker. Spins up a
**self-contained cluster** (no admin, no password) on **port 5433**, with data in
`%LOCALAPPDATA%\edustream\pgdata` (outside the repo and OneDrive, so no sync
corruption).

```powershell
powershell -ExecutionPolicy Bypass -File infra/scripts/start-local-db.ps1
powershell -ExecutionPolicy Bypass -File infra/scripts/stop-local-db.ps1
```

Connection string (this is the default in `backend/.env.example`):

```
postgresql://postgres@localhost:5433/edustream?schema=public
```

> The cluster is started with `pg_ctl`, so it does **not** auto-start on reboot —
> re-run `start-local-db.ps1` after a restart.

## After the DB is up

```bash
cd ../backend
npm run prisma:generate
npm run prisma:push      # Phase 0  (Phase 1+ uses prisma:migrate)
npm run start:dev
```
