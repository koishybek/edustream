export type Role = "STUDENT" | "INSTRUCTOR" | "ADMIN";
export type AppLocale = "ru" | "en" | "kz";
export type Level = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export interface User {
  id: string;
  email: string;
  phone: string | null;
  role: Role;
  name: string;
  avatarUrl: string | null;
  locale: AppLocale;
  interests: string[];
  knowledgeLevel: Level | null;
  createdAt: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: User;
}
