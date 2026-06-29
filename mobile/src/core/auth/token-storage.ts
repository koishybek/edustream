const ACCESS_KEY = "edustream.access";
const REFRESH_KEY = "edustream.refresh";

/**
 * Token persistence. localStorage is the pragmatic MVP choice for a PWA; the
 * access token is short-lived and refreshed transparently. (httpOnly cookies
 * would be the hardening step later.)
 */
export const tokenStorage = {
  get access(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  },
  get refresh(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  },
  set(access: string, refresh: string): void {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};
