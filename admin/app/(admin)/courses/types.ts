/**
 * Shared types + helpers for the admin Courses surface.
 *
 * These mirror the NestJS API contract (`/admin/courses`, `/categories`).
 * Courses are free — there is no price/currency on the wire.
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

/** Lowercase, hyphenated slug from a title (best-effort, editable by hand). */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
