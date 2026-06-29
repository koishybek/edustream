/**
 * Build-time config. Vite exposes `VITE_*` vars to the client.
 * Override per environment in `.env` / `.env.local`.
 */
export const env = {
  apiBaseUrl:
    import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api/v1",
};
