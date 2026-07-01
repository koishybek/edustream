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

export interface ProgressQuiz {
  id: string;
  title: string;
  questionCount: number;
  passed: boolean;
}

export interface ProgressModule {
  id: string;
  title: string;
  order: number;
  lessons: ProgressLesson[];
  quiz: ProgressQuiz | null;
}

export interface CourseProgress {
  progressPercent: number;
  status: "ACTIVE" | "COMPLETED";
  modules: ProgressModule[];
}

// ---- quiz ----

export interface QuizOption {
  id: string;
  text: string;
  order: number;
}
export interface QuizQuestion {
  id: string;
  text: string;
  order: number;
  options: QuizOption[];
}
export interface QuizDetail {
  id: string;
  title: string;
  passingScore: number;
  questions: QuizQuestion[];
}
export interface QuizResultItem {
  questionId: string;
  correctOptionId: string | null;
  chosenOptionId: string | null;
  correct: boolean;
  explanation: string | null;
}
export interface QuizResult {
  score: number;
  passed: boolean;
  passingScore: number;
  correctCount: number;
  totalQuestions: number;
  progressPercent: number;
  results: QuizResultItem[];
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

/** Free, idempotent enrollment (replaces the old paid checkout). */
export function useEnroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (courseId: string) =>
      (await api.post(`/courses/${courseId}/enroll`, {})).data,
    onSuccess: (_data, courseId) => {
      qc.invalidateQueries({ queryKey: ["enrollments"] });
      qc.invalidateQueries({ queryKey: ["course-progress", courseId] });
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

export function useQuiz(
  courseId: string | undefined,
  quizId: string | undefined,
) {
  return useQuery({
    queryKey: ["quiz", courseId, quizId],
    enabled: !!courseId && !!quizId,
    queryFn: async () =>
      (await api.get<QuizDetail>(`/me/courses/${courseId}/quiz/${quizId}`)).data,
  });
}

export function useSubmitQuiz(courseId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      quizId: string;
      answers: { questionId: string; optionId: string }[];
    }) =>
      (
        await api.post<QuizResult>(
          `/me/courses/${courseId}/quiz/${input.quizId}/submit`,
          { answers: input.answers },
        )
      ).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["course-progress", courseId] });
      qc.invalidateQueries({ queryKey: ["enrollments"] });
    },
  });
}
