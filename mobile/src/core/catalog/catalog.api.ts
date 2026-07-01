import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type {
  Category,
  CourseCard,
  CourseDetail,
  CourseFilters,
  CreateReviewInput,
  Paginated,
  Review,
} from "./types";

/** Drop undefined/empty values so they never hit the query string. */
function cleanParams(filters: CourseFilters): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === "") continue;
    out[key] = value as string | number;
  }
  return out;
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await api.get<Category[]>("/categories");
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCourses(filters: CourseFilters) {
  const params = cleanParams(filters);
  return useQuery({
    queryKey: ["courses", params],
    queryFn: async () => {
      const { data } = await api.get<Paginated<CourseCard>>("/courses", {
        params,
      });
      return data;
    },
    // Keep the previous page/grid visible while the next query resolves so the
    // list doesn't flash to a skeleton on every filter tweak.
    placeholderData: (prev) => prev,
  });
}

export function useCourse(slug: string | undefined) {
  return useQuery({
    queryKey: ["course", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data } = await api.get<CourseDetail>(`/courses/${slug}`);
      return data;
    },
  });
}

export function useCourseReviews(
  courseId: string | undefined,
  page = 1,
  pageSize = 10,
) {
  return useQuery({
    queryKey: ["course-reviews", courseId, page, pageSize],
    enabled: !!courseId,
    queryFn: async () => {
      const { data } = await api.get<Paginated<Review>>(
        `/courses/${courseId}/reviews`,
        { params: { page, pageSize } },
      );
      return data;
    },
  });
}

/** Enrolled-only upsert of the current user's review; refreshes rating + list. */
export function useCreateReview(courseId: string, slug: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateReviewInput) => {
      const { data } = await api.post<Review>(
        `/courses/${courseId}/reviews`,
        input,
      );
      return data;
    },
    onSuccess: () => {
      // course detail carries ratingAvg/ratingCount; reviews list is prefix-matched.
      qc.invalidateQueries({ queryKey: ["course", slug] });
      qc.invalidateQueries({ queryKey: ["course-reviews", courseId] });
    },
  });
}
