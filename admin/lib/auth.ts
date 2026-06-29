"use client";

/**
 * Client-side auth helpers for the admin surface.
 *
 * Auth is ADMIN-only: login posts to `/auth/login`, and the page rejects any
 * user whose role !== "ADMIN" before storing the token. We persist a minimal
 * profile alongside the token so the sidebar can greet the admin without a
 * round-trip. Session state lives entirely in localStorage (no SSR cookies).
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, clearToken, getToken, setToken } from "./api";

const USER_KEY = "edustream.admin.user";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: "STUDENT" | "INSTRUCTOR" | "ADMIN";
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AdminUser;
}

/** Authenticate, enforce ADMIN role, and persist the session. */
export async function login(email: string, password: string): Promise<AdminUser> {
  const session = await api<LoginResponse>("/auth/login", {
    method: "POST",
    auth: false,
    body: { email, password },
  });

  if (session.user.role !== "ADMIN") {
    throw new Error("This account does not have admin access.");
  }

  setToken(session.accessToken);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(USER_KEY, JSON.stringify(session.user));
  }
  return session.user;
}

export function getStoredUser(): AdminUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminUser;
  } catch {
    return null;
  }
}

export function logout(): void {
  clearToken();
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(USER_KEY);
  }
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}

/**
 * Guard hook for protected admin pages: redirects to /login when no token is
 * present. Returns `true` once the client-side check has run so pages can avoid
 * flashing protected content during hydration.
 */
export function useRequireAuth(): { ready: boolean; user: AdminUser | null } {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    setUser(getStoredUser());
    setReady(true);
  }, [router]);

  return { ready, user };
}
