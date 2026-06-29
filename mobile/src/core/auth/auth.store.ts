import { create } from "zustand";
import { api } from "../api/client";
import { tokenStorage } from "./token-storage";
import type { AppLocale, AuthSession, Level, User } from "./types";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface OnboardingPatch {
  interests?: string[];
  knowledgeLevel?: Level;
  locale?: AppLocale;
  name?: string;
}

interface AuthState {
  user: User | null;
  status: AuthStatus;
  /** Validate any stored token on startup; load the current user. */
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    email: string;
    password: string;
    name: string;
    locale?: AppLocale;
  }) => Promise<void>;
  updateMe: (patch: OnboardingPatch) => Promise<User>;
  logout: () => void;
}

/** True once the user has completed onboarding (picked a knowledge level). */
export function isOnboarded(user: User | null): boolean {
  return !!user && user.knowledgeLevel !== null;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  status: "loading",

  init: async () => {
    if (!tokenStorage.access) {
      set({ status: "unauthenticated" });
      return;
    }
    try {
      const { data } = await api.get<User>("/auth/me");
      set({ user: data, status: "authenticated" });
    } catch {
      tokenStorage.clear();
      set({ user: null, status: "unauthenticated" });
    }
  },

  login: async (email, password) => {
    const { data } = await api.post<AuthSession>("/auth/login", {
      email,
      password,
    });
    tokenStorage.set(data.accessToken, data.refreshToken);
    set({ user: data.user, status: "authenticated" });
  },

  register: async (input) => {
    const { data } = await api.post<AuthSession>("/auth/register", input);
    tokenStorage.set(data.accessToken, data.refreshToken);
    set({ user: data.user, status: "authenticated" });
  },

  updateMe: async (patch) => {
    const { data } = await api.patch<User>("/auth/me", patch);
    set({ user: data });
    return data;
  },

  logout: () => {
    tokenStorage.clear();
    set({ user: null, status: "unauthenticated" });
  },
}));
