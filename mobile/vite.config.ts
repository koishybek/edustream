import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["favicon.svg", "icon.svg"],
      manifest: {
        name: "EduStream",
        short_name: "EduStream",
        description: "ESG & sustainability education — courses, mentoring, certificates.",
        lang: "ru",
        theme_color: "#14533B",
        background_color: "#F7F6F2",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  server: { port: 5173 },
});
