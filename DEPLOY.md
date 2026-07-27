# EduStream — Deploy (Railway + Vercel)

Three apps + one database:

| Piece | Host | Source dir |
|---|---|---|
| **API** (NestJS) + **PostgreSQL** | Railway | `backend/` |
| **Student PWA** (Vite) | Vercel | `mobile/` |
| **Admin** (Next.js) | Vercel | `admin/` |

Everything deploys **from GitHub**, so step 1 is pushing the repo.

---

## 1. Push to GitHub

Create an **empty** repo at <https://github.com/new> (e.g. `edustream`), then:

```bash
git remote add origin https://github.com/<you>/edustream.git
git push -u origin main
```

---

## 2. Database + API on Railway

1. <https://railway.app> → **New Project** → **Deploy from GitHub repo** → pick `edustream`.
2. In the service **Settings → Root Directory** set `backend`. (Railway reads `backend/railway.json` for build/start.)
3. **New → Database → PostgreSQL** (same project).
4. Open the **backend service → Variables** and add:

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (Railway variable reference) |
   | `JWT_ACCESS_SECRET` | a long random string |
   | `JWT_REFRESH_SECRET` | a different long random string |
   | `JWT_ACCESS_TTL` | `900s` |
   | `JWT_REFRESH_TTL` | `30d` |
   | `CORS_ORIGINS` | *(fill in step 4, after Vercel gives URLs)* |

   Generate secrets: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

5. Deploy. On first boot the start command runs `prisma db push` + a **one-time seed** (`SEED_IF_EMPTY`), so the DB comes up populated with the demo courses/videos. Restarts never re-wipe it.
6. **Settings → Networking → Generate Domain**. Copy the URL, e.g. `https://edustream-api.up.railway.app`.
7. Sanity check: open `https://<api>/api/v1/health` → `{"status":"ok",...}`.

> `PORT` is injected by Railway automatically — the app already reads it.

---

## 3. Frontends on Vercel (two projects, same repo)

**Student PWA:**
1. <https://vercel.com> → **Add New → Project** → import `edustream`.
2. **Root Directory** = `mobile` (Framework auto-detects **Vite**).
3. **Environment Variables**: `VITE_API_BASE_URL = https://<api>.up.railway.app/api/v1`
4. Deploy → note the URL, e.g. `https://edustream-app.vercel.app`.

**Admin:**
1. **Add New → Project** → import the **same** repo again.
2. **Root Directory** = `admin` (Framework auto-detects **Next.js**).
3. **Environment Variables**: `NEXT_PUBLIC_API_BASE_URL = https://<api>.up.railway.app/api/v1`
4. Deploy → note the URL, e.g. `https://edustream-admin.vercel.app`.

---

## 4. Wire CORS (back on Railway)

Set the backend `CORS_ORIGINS` to both Vercel URLs (comma-separated, no trailing slash) and redeploy:

```
CORS_ORIGINS=https://edustream-app.vercel.app,https://edustream-admin.vercel.app
```

---

## 5. Done — demo accounts

Open the PWA URL and sign in:

| Role | Email | Password |
|---|---|---|
| Student | `student@demo.io` | `Student123!` |
| Admin | `admin@demo.io` | `Admin123!` |

Full loop is live: browse → enroll (free) → watch real YouTube lessons → pass module quizzes → complete a course → leave a review. Admin PWA at the admin URL (log in with the admin account).

## Re-seed / reset demo data (optional)

The seed only auto-runs on an empty DB. To force a fresh demo dataset later, run against the Railway DB:

```bash
# with the Railway CLI, from backend/
railway run npm run db:seed        # wipes + reseeds (no SEED_IF_EMPTY = always reseeds)
```

## Notes

- Costs: Railway ~$5/mo credit (no cold starts); Vercel frontends are free.
- Custom domains: add in each platform's project settings, then update `CORS_ORIGINS` + the `*_API_BASE_URL` vars accordingly.
