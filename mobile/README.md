# EduStream — Mobile (PWA)

The student app, built as an **installable Progressive Web App**. Mobile-first,
multilingual (RU / EN / KZ, `ru` default).

> Originally specced as Flutter; built as a PWA per project decision — it runs on
> the Node toolchain (no Flutter SDK), installs to a phone home screen, and works
> offline via a service worker.

## Stack

| Concern | Choice | (Flutter equivalent) |
|---|---|---|
| Framework | **React 18 + Vite + TypeScript** | Flutter |
| State | **TanStack Query** (server) + **Zustand** (client) | Riverpod |
| Routing | **React Router** | GoRouter |
| HTTP | **axios** (interceptors for auth/refresh) | dio |
| PWA | **vite-plugin-pwa** (manifest + service worker) | — |
| Video | HTML5 `<video>` (Phase 3) | video_player/chewie |
| Type | **Golos Text** (display) + **Manrope** (body) — both Cyrillic incl. Kazakh | — |

## Run

```bash
npm install
cp .env.example .env.local         # VITE_API_BASE_URL → your API
npm run dev                        # → http://localhost:5173
```

Build / preview the production PWA (service worker only runs in build):

```bash
npm run build
npm run preview                    # serve the built PWA
```

## Architecture (feature-first)

```
src/
  main.tsx                  # React root + QueryClient + RouterProvider
  index.css                 # Tailwind layers + base
  core/
    theme/tokens.ts         # design tokens (mirror of tailwind.config.ts)
    router.tsx              # React Router (auth gate added in Phase 1)
    env.ts                  # VITE_API_BASE_URL
    api/client.ts           # axios instance (auth interceptor in Phase 1)
  features/
    home/                   # Phase 0 themed placeholder
    # auth/ onboarding/ catalog/ course/ learning/ profile/  → Phase 1+
public/
  icon.svg favicon.svg      # PWA + tab icons (brand leaf mark)
```

## Design system

One restrained **deep-green brand** (primary CTAs only), warm-neutral scale,
distinct semantic hues — see `tailwind.config.ts`. Button intent: filled
(primary) → tonal (secondary) → text (tertiary). Touch targets ≥ 48px.

## Status

Phase 0: themed placeholder wired to tokens/theme/router/query/env, installable
PWA shell. Onboarding, catalog, course, learning and profile land in Phase 1+.
