import 'package:flutter/material.dart';

/// EduStream design tokens — the single source of truth for colour, spacing,
/// radius and elevation. Screens read [AppTheme] (built from these); raw values
/// live here so the palette can't drift across the app.
///
/// Anti-slop guardrails baked in:
///  • A full neutral scale + ONE restrained deep-green brand (primary CTAs
///    only) + distinct semantic hues that don't clash with the brand.
///  • A 4-based spacing scale and a real type scale (see [AppTheme]).
class AppColors {
  AppColors._();

  // --- Neutrals (warm, sustainability feel) ---
  static const Color background = Color(0xFFF7F6F2); // warm off-white
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceAlt = Color(0xFFF1F0EA); // tonal warm grey
  static const Color border = Color(0xFFE4E3DC);
  static const Color borderStrong = Color(0xFFCFCEC5);

  static const Color textPrimary = Color(0xFF1A1C19); // near-black, faint green tint
  static const Color textSecondary = Color(0xFF6B7066);
  static const Color textTertiary = Color(0xFF9CA096);
  static const Color textOnBrand = Color(0xFFFFFFFF);

  // --- Brand: one considered deep green — PRIMARY ACTIONS ONLY ---
  static const Color brand = Color(0xFF14533B); // deep forest green
  static const Color brandPressed = Color(0xFF0F3F2D);
  static const Color brandSubtle = Color(0xFFE6F0EA); // tonal surface / chips
  static const Color brandOnSubtle = Color(0xFF14533B);

  // --- Semantic (distinct hues, don't clash with brand) ---
  static const Color success = Color(0xFF1E8E5A);
  static const Color successSubtle = Color(0xFFE3F3EA);
  static const Color warning = Color(0xFFC2871A);
  static const Color warningSubtle = Color(0xFFF7ECD6);
  static const Color error = Color(0xFFC2453D);
  static const Color errorSubtle = Color(0xFFF7E2E0);
  static const Color info = Color(0xFF3B6FB0);
  static const Color infoSubtle = Color(0xFFE2EAF5);
}

/// 4-based spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64.
class AppSpacing {
  AppSpacing._();
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 24;
  static const double xxl = 32;
  static const double xxxl = 48;
  static const double section = 64;
}

/// Corner radii — rounded, not bubbly.
class AppRadius {
  AppRadius._();
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 24;
  static const double pill = 999;
}

/// Subtle, low-spread elevations for resting surfaces.
class AppElevation {
  AppElevation._();
  static const List<BoxShadow> card = [
    BoxShadow(color: Color(0x0F1A1C19), blurRadius: 16, offset: Offset(0, 6)),
  ];
  static const List<BoxShadow> raised = [
    BoxShadow(color: Color(0x141A1C19), blurRadius: 24, offset: Offset(0, 10)),
  ];
}
