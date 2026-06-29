/**
 * Design tokens — mirror of `tailwind.config.ts` (and the admin's). Tailwind
 * classes are the primary consumption path; these constants exist for the rare
 * inline/JS need (charts, canvas, dynamic styles).
 */
export const colors = {
  background: "#F7F6F2",
  surface: "#FFFFFF",
  surfaceAlt: "#F1F0EA",
  border: "#E4E3DC",
  borderStrong: "#CFCEC5",
  textPrimary: "#1A1C19",
  textSecondary: "#6B7066",
  textTertiary: "#9CA096",
  brand: "#14533B",
  brandPressed: "#0F3F2D",
  brandSubtle: "#E6F0EA",
  success: "#1E8E5A",
  warning: "#C2871A",
  error: "#C2453D",
  info: "#3B6FB0",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;
