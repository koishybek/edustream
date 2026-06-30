# EduStream Production-Real Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement task-by-task. Steps use `- [ ]` checkboxes.

**Goal:** Make EduStream a real, robust local app — free courses (no payments), real YouTube video, module-end quizzes that gate progress, green tests.

**Architecture:** NestJS+Prisma API, React PWA, Next.js admin. Remove the payment layer; add Quiz domain (Quiz 1:1 Module, Question, QuestionOption, QuizAttempt). Progress = lessons + quizzes per module; module done only when all lessons watched AND quiz passed.

**Tech Stack:** Prisma 6 / PostgreSQL, NestJS 10, React 18 + Vite, react-player (new), TanStack Query, Playwright.

Spec: `docs/superpowers/specs/2026-06-30-production-real-design.md`

---

## Task 1 — Prisma schema: drop payments, add quizzes

**Files:** Modify `backend/prisma/schema.prisma`

- [ ] Remove `Course.priceCents` and `Course.currency`.
- [ ] Remove model `Order`, enums `OrderStatus`, `PaymentProvider`. Remove `orders Order[]` from `User` and `Course`.
- [ ] Add models:

```prisma
model Quiz {
  id           String     @id @default(cuid())
  moduleId     String     @unique
  module       Module     @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  title        String
  passingScore Int        @default(60) // percent
  questions    Question[]
  attempts     QuizAttempt[]
}

model Question {
  id          String           @id @default(cuid())
  quizId      String
  quiz        Quiz             @relation(fields: [quizId], references: [id], onDelete: Cascade)
  text        String
  order       Int
  explanation String?
  options     QuestionOption[]
  @@index([quizId])
}

model QuestionOption {
  id         String   @id @default(cuid())
  questionId String
  question   Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  text       String
  isCorrect  Boolean  @default(false)
  order      Int
  @@index([questionId])
}

model QuizAttempt {
  id           String     @id @default(cuid())
  enrollmentId String
  enrollment   Enrollment @relation(fields: [enrollmentId], references: [id], onDelete: Cascade)
  quizId       String
  quiz         Quiz       @relation(fields: [quizId], references: [id], onDelete: Cascade)
  score        Int
  passed       Boolean
  createdAt    DateTime   @default(now())
  @@index([enrollmentId])
  @@index([quizId])
}
```

- [ ] Add to `Module`: `quiz Quiz?`. Add to `Enrollment`: `quizAttempts QuizAttempt[]`.
- [ ] Run: `cd backend; npx prisma migrate dev --name free_courses_and_quizzes` → expect a new migration + client regen.

## Task 2 — Seed: real YouTube videos + quizzes, no prices

**Files:** Modify `backend/prisma/seed.ts`

- [ ] Replace `SAMPLE_VIDEOS` with a `YOUTUBE_VIDEOS` array of real ESG/sustainability YouTube watch URLs (verify live IDs via WebSearch at execution; reputable channels: TED, TED-Ed, World Economic Forum, Kurzgesagt). Keep `nextVideo()` round-robin.
- [ ] Remove `priceCents` from `CourseSeed`, the COURSES entries, and the `course.create` data; remove `currency`. Remove `prisma.order.deleteMany()`.
- [ ] Add `quiz?: { title?; passingScore?; questions: { text; explanation?; options: { text; correct?: boolean }[] }[] }` to `ModuleSeed`. Give EVERY module a quiz with 3–4 questions, each 3–4 options, exactly one `correct: true`, written about that module's topic.
- [ ] In `course.create`, nest quiz creation per module:

```ts
quiz: m.quiz && {
  create: {
    title: m.quiz.title ?? `${m.title} — тест`,
    passingScore: m.quiz.passingScore ?? 60,
    questions: {
      create: m.quiz.questions.map((q, qi) => ({
        text: q.text, order: qi + 1, explanation: q.explanation,
        options: { create: q.options.map((o, oi) => ({ text: o.text, isCorrect: !!o.correct, order: oi + 1 })) },
      })),
    },
  },
},
```

- [ ] Demo enrollment: keep enrolling the student in course #3 with module-1 lessons done; do NOT mark its quiz passed (so the loop is demonstrable). Recompute `progressPercent` using the same formula as the service (lessons + quizzes).
- [ ] Run: `cd backend; npm run db:seed` → expect "Seed complete".

## Task 3 — Backend: remove payments, add free enroll

**Files:** Delete `backend/src/payments/` (provider, service, controller, module). Modify `backend/src/app.module.ts`, `backend/src/learning/learning.controller.ts`, `backend/src/learning/learning.service.ts`.

- [ ] Delete the whole `backend/src/payments/` directory; remove `PaymentsModule` from `app.module.ts` imports + import line.
- [ ] In `learning.service.ts` add:

```ts
/** POST /courses/:id/enroll — free, idempotent. */
async enroll(userId: string, courseId: string) {
  const course = await this.prisma.course.findUnique({ where: { id: courseId }, select: { id: true } });
  if (!course) throw new NotFoundException('Course not found');
  const existing = await this.prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  if (existing) return { enrollmentId: existing.id, alreadyEnrolled: true };
  const created = await this.prisma.enrollment.create({ data: { userId, courseId } });
  return { enrollmentId: created.id, alreadyEnrolled: false };
}
```

- [ ] In `learning.controller.ts` add `@Post('courses/:id/enroll') @HttpCode(200) enroll(...) { return this.learning.enroll(user.sub, id); }` (import HttpCode/HttpStatus).
- [ ] Remove `priceCents`/`currency` from `toCard()` in learning.service.

## Task 4 — Backend: progress recompute + quiz endpoints

**Files:** Modify `backend/src/learning/learning.service.ts`, `learning.controller.ts`; Create `backend/src/learning/dto/submit-quiz.dto.ts`.

- [ ] Add a private `recompute(enrollmentId, courseId)` that counts units = (total lessons) + (total quizzes); done = (completed lessons) + (passed quizzes, distinct quizId where any attempt passed); `progressPercent = round(done/units*100)`; update enrollment status COMPLETED at 100. Call it from `recordProgress` (replace inline counting) and from `submitQuiz`.
- [ ] Rewrite `courseProgress` to return modules with lessons + quiz status:

```ts
// shape: { progressPercent, status, modules: [{ id, title, order, lessons: [{lessonId,title,order,videoUrl,durationSeconds,completed,watchedSeconds}], quiz: { id, title, questionCount, passed } | null }] }
```

Quiz `passed` = exists an attempt with passed=true for this enrollment+quiz. Keep a flat `lessons` array too for backward-compat with current PlayerScreen, OR update PlayerScreen (Task 9) — choose modules shape and update the client.
- [ ] Add `getQuiz(userId, courseId, quizId)`: verify enrollment (403), verify quiz belongs to course (404), return `{ id, title, passingScore, questions: [{ id, text, order, options: [{ id, text, order }] }] }` — NO `isCorrect`.
- [ ] Add `submitQuiz(userId, courseId, quizId, dto)`: verify enrollment; load quiz with questions+options; grade (correct = chosen optionId isCorrect); `score = round(correct/total*100)`; `passed = score >= passingScore`; create `QuizAttempt`; `recompute`; return `{ score, passed, passingScore, progressPercent, results: [{ questionId, correctOptionId, chosenOptionId, correct }] }`.
- [ ] DTO `submit-quiz.dto.ts`: `answers: { questionId: string; optionId: string }[]` with `@ValidateNested`, `@IsArray`, `@IsString`.
- [ ] Controller routes: `GET me/courses/:courseId/quiz/:quizId` → getQuiz; `POST me/courses/:courseId/quiz/:quizId/submit` → submitQuiz.

## Task 5 — Backend: catalog + admin price removal & quiz surface

**Files:** Modify `backend/src/catalog/catalog.service.ts`, `dto/list-courses.dto.ts`; `backend/src/admin/admin.service.ts`, `dto/create-course.dto.ts`, `dto/update-course.dto.ts`.

- [ ] catalog: remove `priceCents`/`currency` from `courseCardSelect`; remove `minPrice`/`maxPrice` filter block; in `getCourseBySlug` modules.select add `quiz: { select: { id: true, _count: { select: { questions: true } } } }` so the curriculum can show "тест".
- [ ] `list-courses.dto.ts`: remove `minPrice`/`maxPrice` fields.
- [ ] admin `stats()`: drop the `order.aggregate`; return `{ users, courses, publishedCourses, enrollments }` (publishedCourses = count where status PUBLISHED).
- [ ] admin `listCourses`: drop `priceCents`/`currency` from mapped data.
- [ ] admin `createCourse`/`updateCourse`: drop `priceCents`/`currency`.
- [ ] create/update DTOs: remove `priceCents`/`currency`.

## Task 6 — Backend tests

**Files:** Modify `backend/test/catalog.e2e-spec.ts`; Delete payments e2e if any; Create `backend/test/learning.e2e-spec.ts`.

- [ ] Remove price assertions / price-filter cases from catalog e2e.
- [ ] New learning e2e: login student → enroll in a course (200, alreadyEnrolled false) → re-enroll (alreadyEnrolled true) → GET progress (modules shape) → mark all module-1 lessons done → GET quiz (no isCorrect leaked) → submit wrong answers (passed false, progress unchanged for that module) → submit correct answers (passed true, progress increases) → 403 when getting quiz while not enrolled (second user).
- [ ] Run: `cd backend; npm run build; npm run test:e2e` → expect green.

## Task 7 — Mobile: data layer (remove checkout, add quiz/enroll)

**Files:** Modify `mobile/src/core/learning/learning.api.ts`, `mobile/src/core/catalog/types.ts`, `mobile/src/core/catalog/format.ts`.

- [ ] Replace `useCheckout` with `useEnroll` (POST `/courses/:id/enroll`, invalidate enrollments + course-progress).
- [ ] Update `CourseProgress` type to `{ progressPercent, status, modules: ProgressModule[] }` with `ProgressModule = { id, title, order, lessons: ProgressLesson[], quiz: { id, title, questionCount, passed } | null }`.
- [ ] Add quiz types + hooks: `useQuiz(courseId, quizId)` (GET), `useSubmitQuiz(courseId)` (POST submit; invalidate course-progress + enrollments). Types: `QuizDetail`, `QuizResult`.
- [ ] `format.ts`: remove `formatKzt`; keep `durationHours`. Remove `priceCents`/`currency` from `CourseCard`/`CourseModule` types in `types.ts`; add `quiz?: { id: string; questionCount: number }` to `CourseModule`.

## Task 8 — Mobile: remove prices from catalog UI

**Files:** Modify `mobile/src/features/home/CourseCardView.tsx`, `HomeScreen.tsx`, `FiltersSheet.tsx`, `mobile/src/features/course/CourseScreen.tsx`.

- [ ] Remove any price rendering from cards/home; remove price range from FiltersSheet (and its query params).
- [ ] CourseScreen: drop payment Sheet, `formatKzt`, method state. CTA becomes: enrolled → "Продолжить" → `/learn/:id`; else "Записаться бесплатно" → `enroll.mutateAsync(course.id)` → on success set `success` state (reuse success screen, change copy to "Вы записаны"). Curriculum ModuleRow: if `module.quiz` show a "Тест · N вопросов" row.

## Task 9 — Mobile: player (YouTube) + module quiz CTA

**Files:** Add dep `react-player`; Create `mobile/src/ui/LessonVideo.tsx`; Modify `mobile/src/features/player/PlayerScreen.tsx`.

- [ ] `cd mobile; npm install react-player`.
- [ ] `LessonVideo.tsx`: `ReactPlayer` with `url`, `controls`, `width/height 100%`; works for YouTube + mp4.
- [ ] PlayerScreen: consume the new `modules` shape (flatten lessons for the current-lesson list, but track which module each lesson belongs to). After the last lesson of a module is completed, show a "Пройти тест модуля" button that navigates to `/learn/:courseId/quiz/:quizId`. If a module's quiz is already passed show a ✓. Mark-done button label "Урок пройден".

## Task 10 — Mobile: QuizScreen + route + i18n

**Files:** Create `mobile/src/features/quiz/QuizScreen.tsx`; Modify `mobile/src/core/router.tsx`, `mobile/src/core/i18n/phase23.dict.ts`.

- [ ] QuizScreen: load quiz via `useQuiz`; render all questions with single-choice options (radio); disable submit until all answered; on submit call `useSubmitQuiz`; show result (score %, passed/failed banner, per-question correct/your-answer highlight, explanation). Failed → "Пересдать" (reset answers). Passed → "Продолжить" → back to `/learn/:courseId`. Loading/error/empty (no questions) states.
- [ ] Route: `/learn/:courseId/quiz/:quizId` (Protected requireOnboarded) before `*`.
- [ ] Add ru/en/kz keys: `quiz.title`, `quiz.submit`, `quiz.passed`, `quiz.failed`, `quiz.score`, `quiz.retry`, `quiz.continue`, `quiz.correct`, `quiz.yourAnswer`, `quiz.takeModuleTest`, `quiz.questionN`, `quiz.empty`, plus enroll copy (`course.enrollFree`, `checkout.enrolledTitle`, `checkout.enrolledBody`). Remove now-dead checkout/price keys if unused.

## Task 11 — Admin: remove prices

**Files:** Modify `admin/app/(admin)/courses/CourseFormModal.tsx`, `courses/types.ts`, `courses/page.tsx`, `dashboard/page.tsx`, `users/page.tsx` (unaffected).

- [ ] Remove the Price field from the form + from POST/PATCH bodies; remove `priceCents`/`currency` from `AdminCourseDetail`/types and course table column.
- [ ] Dashboard: replace the revenue stat card with "Published courses" using the new `publishedCourses` stat; drop `revenueCents`.

## Task 12 — Mobile Playwright + docs/memory

**Files:** Modify a Playwright script in scratchpad; `README.md`; memory `edustream-mvp.md`.

- [ ] Playwright: login student → open a not-enrolled course → "Записаться бесплатно" → My Learning → open player (YouTube iframe present) → complete module-1 lessons → "Пройти тест модуля" → answer correctly → passed → progress increased. Expect all checks pass.
- [ ] README: remove price/payment mentions; document free enroll + quizzes; update build status.
- [ ] Update project memory to reflect: payments removed, courses free, YouTube video, module quizzes gate progress.

---

## Self-review notes
- Progress formula identical in seed (Task 2) and service `recompute` (Task 4) — keep them in sync (units = lessons + quizzes).
- `courseProgress` switches to a `modules` shape — PlayerScreen (Task 9) and learning.api types (Task 7) must move together; LearningScreen only reads `progressPercent` so it's unaffected.
- Quiz GET must never include `isCorrect` (Task 4) — e2e asserts this (Task 6).
- All `priceCents` references (grep found ~29 files) must be gone; final grep should return only migration history.
