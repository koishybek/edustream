import type { Level } from "../auth/types";

/** A category as returned by GET /categories. */
export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

/** Compact course shape used across home, search results and lists. */
export interface CourseCard {
  id: string;
  title: string;
  slug: string;
  description: string;
  level: Level;
  durationMinutes: number;
  ratingAvg: number;
  ratingCount: number;
  coverImageUrl: string | null;
  category: { slug: string; name: string; icon: string | null };
  instructor: { id: string; name: string };
}

/** A lesson inside a module on the public course detail. */
export interface CourseDetailLesson {
  id: string;
  title: string;
  order: number;
  durationSeconds: number;
  isFreePreview: boolean;
}

/** A module (chapter) inside the public course detail. */
export interface CourseModule {
  id: string;
  title: string;
  order: number;
  lessons: CourseDetailLesson[];
  /** Present when the module has an end-of-module quiz. */
  quiz: { id: string; questionCount: number } | null;
}

/** Full public course detail = CourseCard fields + the module/lesson tree. */
export interface CourseDetail extends CourseCard {
  modules: CourseModule[];
}

/** A single review on a course. */
export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { name: string };
}

/** Standard paginated envelope every list endpoint returns. */
export interface Paginated<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
}

export type CourseSort = "popular" | "rating" | "newest";

/** Filters for GET /courses. Undefined keys are omitted from the query. */
export interface CourseFilters {
  search?: string;
  categoryId?: string;
  level?: Level;
  minDuration?: number;
  maxDuration?: number;
  sort?: CourseSort;
  page?: number;
  pageSize?: number;
}
