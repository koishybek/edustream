# EduStream → Phase 5 "Complete" — Design Spec

Date: 2026-07-01
Status: Approved

## Goal

The `production-real` spec (2026-06-30) is fully implemented and green (27 e2e). This phase
adds the standard EdTech pieces that spec deferred, closing three real gaps:

1. **Student reviews (write)** — enrolled students can rate + review a course from the app.
2. **Course completion screen** — a capstone "Курс пройден 🎓" screen at 100%.
3. **Admin quiz editor** — admins can author/edit the module quizzes that gate progress.

Out of scope (YAGNI): downloadable/PDF certificates, certificate verify URLs, review
moderation, quiz timers, randomized banks, per-question navigation, cloud deploy.

Same conventions as the rest of the repo: error envelope `{ error: { code, message } }`,
paginated lists, class-validator DTOs, feature-first mobile, i18n ru/en/kz, green
build + e2e + typechecks.

---

## 1. Student reviews (mobile + one additive backend select)

The backend endpoints already exist and need **no behavioral change** (one additive field in
a `select`, below):
- `POST /courses/:id/reviews` (JWT) — enrolled-only (403 otherwise), `upsert` keyed on
  `@@unique([courseId, userId])` (one review per user, editable), recomputes
  `Course.ratingAvg`/`ratingCount`. Body: `{ rating: 1..5, comment?: string }`.
- `GET /courses/:id/reviews` — paginated, newest first, includes `user.name`.

**Mobile (`mobile/src/`)**
- `core/catalog/catalog.api.ts`: add `useCreateReview(courseId)` → `POST /courses/:id/reviews`;
  on success invalidate the course-detail query and the reviews list query.
- `core/catalog/types.ts`: add `Review` write types if missing.
- `features/course/CourseScreen.tsx`: a "Ваш отзыв" block, visible only when the user is
  **enrolled**. Star picker (1–5) + optional comment textarea. If the user already has a
  review (matched in the loaded reviews list by the current user's id — see the additive
  `user.id` select below) → prefill and label the CTA "Обновить отзыв"; else "Оставить
  отзыв". States: submitting / error /
  success. On success the block collapses to the saved review with an "Изменить" affordance.
- i18n keys (ru/en/kz): `review.yours`, `review.leave`, `review.update`, `review.rating`,
  `review.comment`, `review.commentPlaceholder`, `review.saved`, `review.mustEnroll`.

**How "my review" is identified:** the reviews list `user` select currently returns only
`name`. To let the client find the current user's review, extend the review `user` select to
include `id` (both in `listReviews` and `createReview` return shapes). This is the only
backend touch in this feature and is additive.

## 2. Course completion screen ("Курс пройден")

**Backend (`backend/src/`)**
- Schema: add `Enrollment.completedAt DateTime?` (nullable). One migration
  `add_enrollment_completed_at`.
- `learning.service.ts` `recompute(...)`: when the enrollment transitions **into**
  `COMPLETED` (was not already COMPLETED and now at 100%), set `completedAt = new Date()`.
  Do not overwrite an existing `completedAt` on subsequent recomputes. If a completed course
  later drops below 100% (shouldn't happen, but defensively) leave `completedAt` as-is.
- `courseProgress(...)`: include `completedAt` (and existing `status`, `progressPercent`) in
  the returned payload.

**Mobile**
- `features/completion/CompletionScreen.tsx`: branded capstone view — brand gradient,
  🎓/Lucide icon, student name (from auth store), course title, formatted `completedAt`
  date, a short congrats line, and a "Вернуться к обучению" button → `/learn`.
  No download, no share, no verify.
- Route `/learn/:courseId/complete` (Protected, requireOnboarded), added before `*`.
- Entry points:
  1. **Auto**: when submitting the quiz that pushes progress to 100%, `QuizScreen`'s
     success path navigates to `/learn/:courseId/complete` instead of back to the course.
  2. **Manual**: in `LearningScreen` (My Learning), a completed course shows a "Курс пройден"
     badge/button linking to the completion screen.
- Guard: the screen loads course progress; if `status !== COMPLETED` it redirects to
  `/learn/:courseId` (can't view a certificate you haven't earned).
- i18n keys (ru/en/kz): `completion.title`, `completion.subtitle`, `completion.congrats`,
  `completion.completedOn`, `completion.back`, `learning.completedBadge`.

## 3. Admin quiz editor (full-stack)

Quiz models (`Quiz`/`Question`/`QuestionOption`) already exist — **no schema change**.
Because the existing `AdminService.updateCourse` does **not** sync modules/lessons (it only
updates scalar course fields), quiz management uses **dedicated module-keyed endpoints**
decoupled from the course-update path. Quizzes therefore attach to already-persisted modules.

**Backend (`backend/src/admin/`)**
- Extend `getCourse(id)` include so each module carries its quiz for editing:
  `modules.include = { lessons (ordered), quiz: { include: { questions: { orderBy order,
  include: { options: orderBy order } } } } }`.
- New DTO `upsert-quiz.dto.ts`:
  ```
  UpsertQuizDto {
    title: string (MinLength 1)
    passingScore?: int (0..100, default 60)
    questions: QuestionInput[]  (@IsArray @ValidateNested, ArrayMinSize 1)
  }
  QuestionInput { text: string(≥1); explanation?: string; options: OptionInput[] (ArrayMinSize 2) }
  OptionInput  { text: string(≥1); isCorrect: boolean }
  ```
- New endpoints on `AdminController` (existing `@UseGuards(JwtAuthGuard, RolesGuard)`
  `@Roles(ADMIN)` pattern):
  - `PUT /admin/modules/:moduleId/quiz` → `AdminService.upsertModuleQuiz(moduleId, dto)`.
  - `DELETE /admin/modules/:moduleId/quiz` → `AdminService.deleteModuleQuiz(moduleId)`.
- `upsertModuleQuiz(moduleId, dto)`:
  - 404 if module not found.
  - Validate business rule beyond DTO: **exactly one** `isCorrect` option per question →
    else `BadRequestException` (`code: QUIZ_INVALID`).
  - Transaction: delete existing `Quiz` for the module (cascade removes questions/options),
    then create the new `Quiz` with nested questions + options, `order` derived from array
    index (1-based), `passingScore` default 60.
  - Return the created quiz in edit shape.
- `deleteModuleQuiz(moduleId)`: 404 if no quiz; delete; return `{ deleted: true }`.

**Admin UI (`admin/app/(admin)/courses/`)**
- `types.ts`: extend `AdminCourseDetail` module type with
  `quiz?: { id; title; passingScore; questions: { id; text; explanation?; options:
  { id; text; isCorrect }[] }[] }`.
- `CourseFormModal.tsx`: under each module (below its lessons) add a collapsible **"Тест"**
  section: quiz title, passing-score number input, a list of questions (text + optional
  explanation), each with a list of options (text + a radio to mark the single correct one),
  add/remove question, add/remove option, and a "Удалить тест" control.
- Save flow: after the course PATCH/POST succeeds and module ids are known, for each module
  that has a quiz definition call `PUT /admin/modules/:id/quiz`; for modules whose quiz was
  removed call `DELETE`. Show per-module save errors inline.
- Client validation mirrors the server: "Сохранить" disabled (or the module flagged) if any
  question has zero or multiple correct options, fewer than 2 options, or empty text.
- New-course caveat surfaced in UI copy: quizzes are editable after the course (and its
  modules) are saved.

---

## Testing

- **Backend e2e** (extend `test/` — new `admin.e2e-spec.ts`, extend `learning.e2e-spec.ts`):
  - Admin quiz: `PUT` creates a quiz (200 + edit shape); re-`PUT` replaces it; `GET` course
    returns the quiz for editing; student `GET .../quiz/:id` still never leaks `isCorrect`.
  - Validation: question with no correct option → 400; question with 2 correct → 400;
    question with <2 options → 400.
  - AuthZ: non-admin (student token) hitting admin quiz endpoints → 403.
  - `DELETE` removes the quiz; module then reports no quiz.
  - Completion: drive an enrollment to 100% (all lessons done + quiz passed) → enrollment
    `status = COMPLETED` and `completedAt` set; `courseProgress` returns `completedAt`;
    a second recompute does not change `completedAt`.
- **Reviews**: confirm existing `catalog.e2e` covers enrolled-only + upsert; add a case only
  if missing. Mobile review flow: optional Playwright (enroll → leave review → rating shows).
- **Typechecks/build green**: `backend build`, `mobile tsc`, `admin tsc`, `backend test:e2e`.

## Data / migration

One migration: `add_enrollment_completed_at` (adds nullable `Enrollment.completedAt`).
No other schema change. Seed is unaffected (existing quizzes already seeded); optionally the
demo can be left one quiz short of completion so the completion screen is demonstrable — the
current seed already leaves module-1's quiz pending, which is sufficient.

## Decisions

- Certificate = in-app completion screen only (no file, no verify) — user choice.
- Reviews = any enrolled student (not gated on completion) — user choice.
- Admin quiz editor = nested in the course form UI, backed by module-keyed endpoints — user
  choice for UX; endpoints chosen to avoid the `updateCourse` curriculum-sync gap.
- Quiz "replace-all" upsert (delete + recreate) over diffing — simpler, transactional, and
  quiz sizes are small.

## Build order (vertical slices)

1. Reviews (mobile + tiny `user.id` select) — smallest, backend ready.
2. Completion screen (`completedAt` migration + service + mobile screen/route).
3. Admin quiz editor (DTO + endpoints + service + admin UI) — largest.
