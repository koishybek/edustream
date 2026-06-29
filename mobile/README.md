# EduStream — Mobile (Flutter)

The student app. Mobile-first, multilingual (RU / EN / KZ, `ru` default).

## Stack

- **Flutter** (stable, Dart 3), **Riverpod** (state), **GoRouter** (nav), **dio** (HTTP)
- **flutter_secure_storage** (tokens), **video_player** + **chewie** (lessons)
- **flutter_localizations** + ARB files (i18n), **google_fonts** (Manrope)

## Prerequisites

- Flutter SDK (stable). Check with `flutter doctor`. [Install guide.](https://docs.flutter.dev/get-started/install)
- The backend API running (see [`../backend/README.md`](../backend/README.md)).

## Run

```bash
flutter pub get
flutter run            # choose a device / emulator
```

Point the app at your API (defaults to `http://localhost:4000/api/v1`):

```bash
# Android emulator can't see "localhost" — use the host alias 10.0.2.2:
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:4000/api/v1
```

## Architecture (feature-first)

```
lib/
  main.dart                 # ProviderScope + MaterialApp.router
  core/
    theme/tokens.dart       # design tokens (colour, spacing, radius, elevation)
    theme/app_theme.dart    # ThemeData + Manrope type scale + button intents
    router/app_router.dart  # GoRouter (auth gate added in Phase 1)
    env/env.dart            # API base URL (--dart-define overridable)
  features/
    home/                   # Phase 0 themed placeholder
    # auth/ onboarding/ catalog/ course/ learning/ profile/  → Phase 1+
  l10n/
    app_en.arb app_ru.arb app_kz.arb   # generate: true in pubspec → AppLocalizations
```

## Design system

One restrained **deep-green brand** (primary CTAs only), a full warm-neutral
scale, and distinct semantic hues — see `core/theme/tokens.dart`. Buttons carry
intent: `FilledButton` (primary) → `FilledButton.tonal` (secondary) →
`TextButton` (tertiary). Touch targets ≥ 48dp.

## Status

Phase 0: themed placeholder wired to tokens/theme/router/Riverpod/env. The
onboarding, catalog, course, learning and profile features land in Phase 1+.
