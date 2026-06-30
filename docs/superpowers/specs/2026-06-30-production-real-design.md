# EduStream → Production-real — Design Spec

Date: 2026-06-30
Status: Approved

## Goal

Turn the MVP into a real, robust, locally-runnable app:
1. Remove all prices — every course is free; cut the payment layer entirely.
2. Real video content via YouTube embeds (no more sample MP4 placeholders).
3. Real quizzes/tests — one quiz at the end of each module, gating progress.
4. Production robustness — all UI states, validation, green e2e + unit tests, real seed content.

Out of scope (YAGNI): certificates, quiz timers, randomized question banks, cloud deployment.

## 1. Remove prices (everything free)

**Backend**
- Delete `payments/` module (provider, service, controller, module).
- Drop Prisma model `Order`, enums `OrderStatus` and `PaymentProvider`.
- Drop `Course.priceCents` and `Course.currency`.
- Replace `POST /courses/:id/checkout` with `POST /courses/:id/enroll` — free, idempotent (returns existing enrollment if already enrolled).

**Mobile (PWA)**
- Remove payment sheet from `CourseScreen`. CTA: "Записаться бесплатно" → enroll → "Продолжить".
- Remove price from Home cards, CourseScreen meta, `core/catalog/format.ts`.

**Admin**
- Remove price field from the course form; remove price/revenue columns from tables and dashboard (replace revenue stat with another meaningful count, e.g. total enrollments / published courses).

## 2. Video = real YouTube

- Add `react-player` to the PWA.
- A `LessonVideo` component renders a YouTube embed when the URL is a YouTube link, else falls back to native `<video>`.
- Seed lessons with real, stable YouTube videos on ESG / sustainability topics, easily swappable.

## 3. Quizzes (end of module, gate progress)

**New Prisma models**
- `Quiz` — 1:1 with `Module` (`moduleId @unique`), `title`, `passingScore Int @default(60)`.
- `Question` — belongs to `Quiz`, `text`, `order`, optional `explanation`.
- `QuestionOption` — belongs to `Question`, `text`, `isCorrect Boolean`, `order`.
- `QuizAttempt` — belongs to `Enrollment` + `Quiz`, `score Int` (percent), `passed Boolean`, `createdAt`. Multiple attempts allowed; latest/passed tracked.

**Progress logic (recompute rewritten)**
- A module's progress units = its lessons + its quiz (if any).
- A lesson counts when watched/marked done (button kept, label "Урок пройден").
- A module is complete only when all its lessons are done AND its quiz is passed (score ≥ passingScore).
- `Enrollment.progressPercent` = done units / total units across the course.
- `Enrollment.status = COMPLETED` at 100% (all lessons done + all quizzes passed).

**New endpoints**
- `GET /me/courses/:courseId/quiz/:quizId` — questions + options WITHOUT `isCorrect`; enrolled users only (403 otherwise).
- `POST /me/courses/:courseId/quiz/:quizId/submit` — body `{ answers: { questionId, optionId }[] }`. Grades, stores `QuizAttempt`, recomputes progress, returns `{ score, passed, results: { questionId, correctOptionId, chosenOptionId, correct }[], progressPercent }`. Validated with class-validator.

**Mobile**
- `QuizScreen` — all questions on one screen (list), single-choice options, submit, result view (score, per-question correct/incorrect, "Пересдать" if failed, "Продолжить" if passed).
- In the player, after all of a module's lessons are done, a "Пройти тест модуля" CTA appears → routes to the quiz.
- i18n keys (ru/en/kz) for quiz strings.

## 4. Production robustness

- All states: loading / error / empty (empty catalog, no enrollments, quiz with no questions).
- Friendly errors; DTO validation on quiz submit.
- Tests green:
  - Backend e2e: free enroll, quiz grading + gating, progress recompute including quizzes; update catalog e2e (no price); remove payments tests.
  - Mobile Playwright: enroll → watch video → pass quiz → progress increases.
- Real seed content: real videos + meaningful per-module questions.

## Database migration

One migration: drop `Order` + `Course.priceCents`/`currency`; add `Quiz` / `Question` / `QuestionOption` / `QuizAttempt`. Reseed with real videos + quizzes.

## Decisions

- Covers unchanged (brand gradient + Lucide icon, per design system).
- Quiz: all questions listed on one screen (not one-per-screen).
