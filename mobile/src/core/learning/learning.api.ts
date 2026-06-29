import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { CourseCard } from "../catalog/types";

export interface Enrollment {
  id: string;
  status: "ACTIVE" | "COMPLETED";
  progressPercent: number;
  course: CourseCard;
}

export interface ProgressLesson {
  lessonId: string;
  title: string;
  order: number;
  moduleTitle: string;
  videoUrl: string;
  durationSeconds: number;
  completed: boolean;
  watchedSeconds: number;
}

export interface CourseProgress {
  progressPercent: number;
  status: "ACTIVE" | "COMPLETED";
  lessons: ProgressLesson[];
}

export function useEnrollments() {
  return useQuery({
    queryKey: ["enrollments"],
    queryFn: async () => (await api.get<Enrollment[]>("/me/enrollments")).data,
  });
}

export function useCourseProgress(courseId: string | undefined) {
  return useQuery({
    queryKey: ["course-progress", courseId],
    enabled: !!courseId,
    queryFn: async () =>
      (await api.get<CourseProgress>(`/me/courses/${courseId}/progress`)).data,
  });
}

export function useCheckout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (courseId: string) =>
      (await api.post(`/courses/${courseId}/checkout`, {})).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["enrollments"] });
    },
  });
}

export function useRecordProgress(courseId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      lessonId: string;
      completed?: boolean;
      watchedSeconds?: number;
    }) =>
      (
        await api.post<{ progressPercent: number }>(
          `/lessons/${input.lessonId}/progress`,
          { completed: input.completed, watchedSeconds: input.watchedSeconds },
        )
      ).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["course-progress", courseId] });
      qc.invalidateQueries({ queryKey: ["enrollments"] });
    },
  });
}
