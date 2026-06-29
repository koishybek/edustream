import type { Config } from "tailwindcss";

/**
 * Admin design tokens — mirror of the Flutter `tokens.dart` so both surfaces
 * share one EduStream design language: warm neutrals, ONE deep-green brand for
 * primary actions, and distinct semantic hues.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#F7F6F2",
        surface: "#FFFFFF",
        "surface-alt": "#F1F0EA",
        border: "#E4E3DC",
        "border-strong": "#CFCEC5",
        "text-primary": "#1A1C19",
        "text-secondary": "#6B7066",
        "text-tertiary": "#9CA096",
        brand: {
          DEFAULT: "#14533B",
          pressed: "#0F3F2D",
          subtle: "#E6F0EA",
        },
        success: { DEFAULT: "#1E8E5A", subtle: "#E3F3EA" },
        warning: { DEFAULT: "#C2871A", subtle: "#F7ECD6" },
        error: { DEFAULT: "#C2453D", subtle: "#F7E2E0" },
        info: { DEFAULT: "#3B6FB0", subtle: "#E2EAF5" },
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
      },
      fontFamily: {
        sans: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 6px 16px rgba(26,28,25,0.06)",
        raised: "0 10px 24px rgba(26,28,25,0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
