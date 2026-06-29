# EduStream — Admin (Next.js)

Minimal web admin. Same `/api/v1` API as the mobile app. Login is **ADMIN-only**.

## Stack

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind CSS**
- Design tokens mirror the Flutter app (`tailwind.config.ts` ↔ `mobile/.../tokens.dart`).

## Setup & run

```bash
npm install
cp .env.example .env.local     # NEXT_PUBLIC_API_BASE_URL → your API
npm run dev                    # → http://localhost:3000  (redirects to /login)
```

Build:

```bash
npm run build && npm run start
```

## Pages

| Route | Status |
|---|---|
| `/` | redirect → `/login` |
| `/login` | ✅ login shell (auth wired in Phase 4) |
| `/dashboard` | ⬜ Phase 4 — stats cards |
| `/courses` | ⬜ Phase 4 — course CRUD (modules/lessons editor) |
| `/users` | ⬜ Phase 4 — users table (read-only) |

Kept intentionally minimal — no gold-plating.
