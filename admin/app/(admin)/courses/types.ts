/**
 * Shared types + helpers for the admin Courses surface.
 *
 * These mirror the NestJS API contract (`/admin/courses`, `/categories`). Money
 * is always integer cents in KZT; never carry floating tenge across the wire.
 */

export type CourseStatus = "DRAFT" | "PUBLISHED";
export type Level = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export const LEVELS: Level[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];
export const STATUSES: CourseStatus[] = ["DRAFT", "PUBLISHED"];

/** Standard list envelope used by every list endpoint. */
export interface Paginated<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

/**
 * A row from `GET /admin/courses`. The list includes category + instructor and
 * module/lesson counts; we keep the count shape permissive (explicit field or a
 * Prisma `_count`) so the page renders regardless of the exact serialization.
 */
export interface AdminCourseRow {
  id: string;
  title: string;
  slug: string;
  status: CourseStatus;
  priceCents: number;
  currency: string;
  ratingAvg: number;
  ratingCount: number;
  category?: { id: string; name: string; slug: string; icon: string } | null;
  instructor?: { id: string; name: string } | null;
  lessonCount?: number;
  _count?: { lessons?: number; modules?: number };
  modules?: Array<{
    lessons?: unknown[];
    _count?: { lessons?: number };
  }>;
}

/** Lesson rows inside the modules editor. */
export interface LessonDraft {
  id?: string;
  title: string;
  durationSeconds: number;
  videoUrl: string;
  isFreePreview: boolean;
}

export interface ModuleDraft {
  id?: string;
  title: string;
  lessons: LessonDraft[];
}

/** The full course detail returned by `GET /admin/courses/:id` (for editing). */
export interface AdminCourseDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  categoryId: string;
  level: Level;
  durationMinutes: number;
  priceCents: number;
  coverImageUrl: string | null;
  status: CourseStatus;
  modules?: Array<{
    id: string;
    title: string;
    order: number;
    lessons?: Array<{
      id: string;
      title: string;
      order: number;
      durationSeconds: number;
      videoUrl?: string;
      isFreePreview: boolean;
    }>;
  }>;
}

/** Body for POST/PATCH `/admin/courses`, with optional nested modules/lessons. */
export interface CourseWriteBody {
  title: string;
  slug: string;
  description: string;
  categoryId: string;
  level: Level;
  durationMinutes: number;
  priceCents: number;
  coverImageUrl?: string | null;
  status: CourseStatus;
  modules: Array<{
    title: string;
    order: number;
    lessons: Array<{
      title: string;
      order: number;
      durationSeconds: number;
      videoUrl: string;
      isFreePreview: boolean;
    }>;
  }>;
}

/** KZT amounts are integer cents; render whole tenge with the ₸ symbol. */
export function formatTenge(cents: number): string {
  const tenge = Math.round(cents / 100);
  return `${tenge.toLocaleString("en-US")} ₸`;
}

/** Lowercase, hyphenated slug from a title (best-effort, editable by hand). */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
