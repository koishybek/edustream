# EduStream Phase 5 "Complete" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add student reviews (write), a course-completion screen, and an admin quiz editor — the standard EdTech pieces the `production-real` spec deferred — keeping build + e2e + typechecks green.

**Architecture:** NestJS+Prisma API, React+Vite PWA, Next.js admin. Reviews backend already exists (only an additive `user.id` select). Completion adds `Enrollment.completedAt` + a mobile screen. Admin quizzes use dedicated module-keyed endpoints (`PUT/DELETE /admin/modules/:moduleId/quiz`) to sidestep the `updateCourse` curriculum-sync gap; quiz models already exist.

**Tech Stack:** Prisma 6 / PostgreSQL (dev DB on :5433), NestJS 10, React 18 + Vite, TanStack Query, Next.js App Router, Jest + Supertest e2e.

Spec: `docs/superpowers/specs/2026-07-01-phase5-complete-design.md`

**Conventions:** run backend commands from `backend/`, admin from `admin/`, mobile from `mobile/`. Tests run against the seeded dev DB — run `npm run db:seed` in `backend/` first if the DB is empty. Error envelope `{ error: { code, message } }`. Demo users: `student@demo.io`/`Student123!`, `admin@demo.io`/`Admin123!`, `marat@demo.io`/`Reviewer123!` (a second non-enrolled student).

---

## Slice A — Student reviews (mobile + additive backend select)

### Task A1: Backend — expose `user.id` on reviews (additive)

**Files:**
- Modify: `backend/src/catalog/catalog.service.ts` (the two `user: { select: { name: true } }` blocks in `listReviews` and `createReview`)
- Test: `backend/test/catalog.e2e-spec.ts`

- [ ] **Step 1: Write the failing test.** Append to `backend/test/catalog.e2e-spec.ts` inside its top-level `describe`. It logs in the student, ensures a review exists (upsert via POST), then asserts the list returns `user.id`.

```ts
it('reviews include the reviewer user id (for "my review" matching)', async () => {
  const login = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email: 'student@demo.io', password: 'Student123!' })
    .expect(200);
  const token = login.body.accessToken as string;

  // The seeded student is pre-enrolled in course #3; use whatever they're enrolled in.
  const enrollment = await prisma.enrollment.findFirstOrThrow({
    where: { user: { email: 'student@demo.io' } },
    select: { courseId: true },
  });

  await request(app.getHttpServer())
    .post(`/api/v1/courses/${enrollment.courseId}/reviews`)
    .set('Authorization', `Bearer ${token}`)
    .send({ rating: 5, comment: 'phase5 test review' })
    .expect(201);

  const res = await request(app.getHttpServer())
    .get(`/api/v1/courses/${enrollment.courseId}/reviews`)
    .expect(200);

  expect(res.body.data.length).toBeGreaterThan(0);
  expect(res.body.data[0].user).toEqual(
    expect.objectContaining({ id: expect.any(String), name: expect.any(String) }),
  );
});
```

> Note: check `catalog.e2e-spec.ts` for an existing `prisma` handle; if it's named differently, reuse that. If the file has no `prisma`, add `let prisma: PrismaService;` and `prisma = app.get(PrismaService);` in its `beforeAll` (import `PrismaService` from `../src/prisma/prisma.service`).

- [ ] **Step 2: Run it, verify it fails.**
Run: `npm run test:e2e -- catalog`
Expected: FAIL — `user` has `name` but no `id`.

- [ ] **Step 3: Add `id: true` to both user selects.** In `catalog.service.ts`, change both occurrences of `user: { select: { name: true } }` (in `listReviews` and `createReview`) to:

```ts
user: { select: { id: true, name: true } },
```

- [ ] **Step 4: Run it, verify it passes.**
Run: `npm run test:e2e -- catalog`
Expected: PASS.

- [ ] **Step 5: Commit.**
```bash
git add backend/src/catalog/catalog.service.ts backend/test/catalog.e2e-spec.ts
git commit -m "feat(reviews): expose reviewer user.id for my-review matching"
```

### Task A2: Mobile — review write hook + types

**Files:**
- Modify: `mobile/src/core/catalog/types.ts` (add review write types)
- Modify: `mobile/src/core/catalog/catalog.api.ts` (add `useCreateReview`)

- [ ] **Step 1: Add types.** In `mobile/src/core/catalog/types.ts` add:

```ts
export interface CourseReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { id: string; name: string };
}

export interface CreateReviewInput {
  rating: number;      // 1..5
  comment?: string;
}
```

If a `Review` type already exists there, extend it with `user.id` rather than duplicating.

- [ ] **Step 2: Add the mutation hook.** In `mobile/src/core/catalog/catalog.api.ts`, following the existing `useQuery`/`useMutation` patterns and the shared `api` axios client, add:

```ts
export function useCreateReview(courseId: string, courseSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReviewInput) =>
      api.post(`/courses/${courseId}/reviews`, input).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['course', courseSlug] });
      qc.invalidateQueries({ queryKey: ['reviews', courseId] });
    },
  });
}
```

> Match the existing query keys in this file — read how `getCourseBySlug`/reviews queries are keyed and mirror them exactly (the keys above are illustrative; use the real ones). Import `useMutation, useQueryClient` from `@tanstack/react-query` and `CreateReviewInput` from `./types` if not already imported.

- [ ] **Step 3: Typecheck.**
Run (from `mobile/`): `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 4: Commit.**
```bash
git add mobile/src/core/catalog/types.ts mobile/src/core/catalog/catalog.api.ts
git commit -m "feat(reviews): mobile useCreateReview hook + types"
```

### Task A3: Mobile — "Your review" block on CourseScreen + i18n

**Files:**
- Modify: `mobile/src/features/course/CourseScreen.tsx`
- Modify: `mobile/src/core/i18n/phase23.dict.ts` (add keys to ru/en/kz)

- [ ] **Step 1: Add i18n keys.** In `phase23.dict.ts`, add to each of the ru/en/kz maps:

```ts
// ru
"review.yours": "Ваш отзыв",
"review.leave": "Оставить отзыв",
"review.update": "Обновить отзыв",
"review.rating": "Оценка",
"review.comment": "Комментарий",
"review.commentPlaceholder": "Поделитесь впечатлением…",
"review.saved": "Спасибо! Ваш отзыв сохранён.",
"review.edit": "Изменить",
"review.mustEnroll": "Запишитесь на курс, чтобы оставить отзыв",
// en
"review.yours": "Your review", "review.leave": "Leave a review", "review.update": "Update review",
"review.rating": "Rating", "review.comment": "Comment", "review.commentPlaceholder": "Share your impression…",
"review.saved": "Thanks! Your review was saved.", "review.edit": "Edit", "review.mustEnroll": "Enroll to leave a review",
// kz
"review.yours": "Сіздің пікіріңіз", "review.leave": "Пікір қалдыру", "review.update": "Пікірді жаңарту",
"review.rating": "Баға", "review.comment": "Пікір", "review.commentPlaceholder": "Әсеріңізбен бөлісіңіз…",
"review.saved": "Рақмет! Пікір сақталды.", "review.edit": "Өзгерту", "review.mustEnroll": "Пікір қалдыру үшін тіркеліңіз",
```

- [ ] **Step 2: Render the block.** In `CourseScreen.tsx`, near the existing reviews list, add a "Your review" block shown only when the user is **enrolled** (reuse whatever enrolled flag the screen already computes for its CTA). Determine `myReview` by matching the current user's id (from the auth store) against the loaded reviews list. Use the `useCreateReview` hook. Minimal shape:

```tsx
// inside the component
const createReview = useCreateReview(course.id, course.slug);
const myUserId = useAuthStore((s) => s.user?.id);
const myReview = reviews?.find((r) => r.user.id === myUserId) ?? null;
const [editing, setEditing] = useState(false);
const [rating, setRating] = useState(myReview?.rating ?? 5);
const [comment, setComment] = useState(myReview?.comment ?? "");

// render (only when enrolled):
// - if myReview && !editing → show stars + comment + t("review.edit") button (sets editing=true)
// - else → star picker (1..5, tap to set), textarea(comment), submit button
//   label = myReview ? t("review.update") : t("review.leave")
//   onClick → createReview.mutateAsync({ rating, comment }).then(() => setEditing(false))
// - show createReview.isPending (disable), createReview.isError (friendly), success via t("review.saved")
```

Follow the screen's existing star-rendering (it already shows `ratingAvg` stars) and button styles. If the auth store selector differs, read `mobile/src/core/auth/auth.store.ts` for the real user shape.

- [ ] **Step 3: Typecheck + eyeball.**
Run (from `mobile/`): `npx tsc --noEmit`
Expected: exit 0. (Manual: enrolled course → set stars → submit → block shows saved review; rating count updates after refetch.)

- [ ] **Step 4: Commit.**
```bash
git add mobile/src/features/course/CourseScreen.tsx mobile/src/core/i18n/phase23.dict.ts
git commit -m "feat(reviews): leave/update review UI on CourseScreen"
```

---

## Slice B — Course completion screen

### Task B1: Schema — `Enrollment.completedAt` + migration

**Files:**
- Modify: `backend/prisma/schema.prisma` (model `Enrollment`)

- [ ] **Step 1: Add the column.** In `model Enrollment`, add under `createdAt`:

```prisma
  completedAt     DateTime?
```

- [ ] **Step 2: Create + apply the migration.**
Run (from `backend/`): `npx prisma migrate dev --name add_enrollment_completed_at`
Expected: a new migration under `prisma/migrations/…add_enrollment_completed_at/` and regenerated client.

- [ ] **Step 3: Commit.**
```bash
git add backend/prisma/schema.prisma backend/prisma/migrations
git commit -m "feat(learning): add Enrollment.completedAt"
```

### Task B2: Backend — set `completedAt` on completion + return it

**Files:**
- Modify: `backend/src/learning/learning.service.ts` (`recompute` and `courseProgress`)
- Test: `backend/test/learning.e2e-spec.ts`

- [ ] **Step 1: Write the failing test.** Append inside the existing `describe` in `learning.e2e-spec.ts`. It completes every lesson + passes every quiz in the suite's `courseId`, then asserts `COMPLETED` + a `completedAt` surfaced by the progress endpoint. Uses the existing DB helpers style.

```ts
it('completing all lessons + quizzes sets completedAt and COMPLETED', async () => {
  // complete every lesson in the course
  const lessons = await prisma.lesson.findMany({ where: { module: { courseId } } });
  for (const l of lessons) {
    await request(app.getHttpServer())
      .post(`/api/v1/lessons/${l.id}/progress`)
      .set('Authorization', `Bearer ${token}`)
      .send({ completed: true, watchedSeconds: l.durationSeconds })
      .expect(201);
  }
  // pass every quiz in the course
  const quizzes = await prisma.quiz.findMany({ where: { module: { courseId } } });
  for (const qz of quizzes) {
    const questions = await prisma.question.findMany({ where: { quizId: qz.id }, include: { options: true } });
    const answers = questions.map((q) => ({
      questionId: q.id,
      optionId: q.options.find((o) => o.isCorrect)!.id,
    }));
    await request(app.getHttpServer())
      .post(`/api/v1/me/courses/${courseId}/quiz/${qz.id}/submit`)
      .set('Authorization', `Bearer ${token}`)
      .send({ answers })
      .expect(200);
  }

  const res = await request(app.getHttpServer())
    .get(`/api/v1/me/courses/${courseId}/progress`)
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  expect(res.body.progressPercent).toBe(100);
  expect(res.body.status).toBe('COMPLETED');
  expect(res.body.completedAt).toEqual(expect.any(String));

  // completedAt is stable on a second recompute (mark a lesson done again)
  const firstCompletedAt = res.body.completedAt;
  await request(app.getHttpServer())
    .post(`/api/v1/lessons/${lessons[0].id}/progress`)
    .set('Authorization', `Bearer ${token}`)
    .send({ completed: true, watchedSeconds: lessons[0].durationSeconds })
    .expect(201);
  const again = await request(app.getHttpServer())
    .get(`/api/v1/me/courses/${courseId}/progress`)
    .set('Authorization', `Bearer ${token}`)
    .expect(200);
  expect(again.body.completedAt).toBe(firstCompletedAt);
});
```

- [ ] **Step 2: Run it, verify it fails.**
Run: `npm run test:e2e -- learning`
Expected: FAIL — `completedAt` is `undefined` (not returned; not set).

- [ ] **Step 3: Implement.** In `learning.service.ts`:

(a) Change `recompute` to set `completedAt` only on the transition into COMPLETED. Replace the final `enrollment.update` block with:

```ts
    const nowCompleted = progressPercent >= 100;
    const current = await this.prisma.enrollment.findUniqueOrThrow({
      where: { id: enrollmentId },
      select: { completedAt: true },
    });
    await this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        progressPercent,
        status: nowCompleted ? 'COMPLETED' : 'ACTIVE',
        // set once, on first reaching 100%; never overwrite an existing stamp
        completedAt: nowCompleted && !current.completedAt ? new Date() : undefined,
      },
    });
    return progressPercent;
```

(b) In `courseProgress`, include `completedAt` in the returned object:

```ts
    return {
      progressPercent: enrollment.progressPercent,
      status: enrollment.status,
      completedAt: enrollment.completedAt,
      modules: modules.map((m) => ({
```

- [ ] **Step 4: Run it, verify it passes.**
Run: `npm run test:e2e -- learning`
Expected: PASS (all learning tests).

- [ ] **Step 5: Commit.**
```bash
git add backend/src/learning/learning.service.ts backend/test/learning.e2e-spec.ts
git commit -m "feat(learning): stamp completedAt on completion; return it in progress"
```

### Task B3: Mobile — CompletionScreen + route + entry points + i18n

**Files:**
- Create: `mobile/src/features/completion/CompletionScreen.tsx`
- Modify: `mobile/src/core/router.tsx` (add route)
- Modify: `mobile/src/features/quiz/QuizScreen.tsx` (auto-nav on 100%)
- Modify: `mobile/src/features/learning/LearningScreen.tsx` (completed badge)
- Modify: `mobile/src/core/learning/learning.api.ts` (ensure `CourseProgress` type carries `completedAt`, `status`)
- Modify: `mobile/src/core/i18n/phase23.dict.ts`

- [ ] **Step 1: Add i18n keys** (ru/en/kz) in `phase23.dict.ts`:

```ts
// ru
"completion.title": "Курс пройден!", "completion.congrats": "Поздравляем, вы завершили курс",
"completion.completedOn": "Завершено", "completion.back": "Вернуться к обучению",
"learning.completedBadge": "Курс пройден",
// en
"completion.title": "Course completed!", "completion.congrats": "Congratulations on finishing",
"completion.completedOn": "Completed", "completion.back": "Back to learning",
"learning.completedBadge": "Completed",
// kz
"completion.title": "Курс аяқталды!", "completion.congrats": "Курсты аяқтағаныңызбен құттықтаймыз",
"completion.completedOn": "Аяқталды", "completion.back": "Оқуға оралу",
"learning.completedBadge": "Аяқталды",
```

- [ ] **Step 2: Ensure the progress type carries the new fields.** In `learning.api.ts`, extend the `CourseProgress` type (added in Phase 3) with:

```ts
  status: "ACTIVE" | "COMPLETED";
  completedAt: string | null;
```

Run `npx tsc --noEmit` — expect it to compile (or reveal call sites; leave them, they only read).

- [ ] **Step 3: Create the screen.** `mobile/src/features/completion/CompletionScreen.tsx`:

```tsx
import { useParams, useNavigate } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { useCourseProgress } from "../../core/learning/learning.api";
import { useAuthStore } from "../../core/auth/auth.store";
import { useI18n } from "../../core/i18n/I18nProvider";

export function CompletionScreen() {
  const { courseId = "" } = useParams();
  const nav = useNavigate();
  const { t, locale } = useI18n();
  const name = useAuthStore((s) => s.user?.name ?? "");
  const { data, isLoading } = useCourseProgress(courseId);

  if (isLoading) return <div className="screen center">…</div>;
  // guard: can't view a certificate you haven't earned
  if (!data || data.status !== "COMPLETED") {
    nav(`/learn/${courseId}`, { replace: true });
    return null;
  }
  const date = data.completedAt
    ? new Date(data.completedAt).toLocaleDateString(locale === "kz" ? "kk" : locale)
    : "";

  return (
    <div className="screen completion">
      <div className="cert-card">
        <GraduationCap size={64} />
        <h1 className="t-h1">{t("completion.title")}</h1>
        <p className="t-body">{t("completion.congrats")}</p>
        <p className="t-h3 cert-name">{name}</p>
        {date && <p className="t-body-2">{t("completion.completedOn")}: {date}</p>}
        <button className="btn btn-primary" onClick={() => nav("/learn")}>
          {t("completion.back")}
        </button>
      </div>
    </div>
  );
}
```

> Match the real imports/props: read `useCourseProgress` signature in `learning.api.ts`, the auth store user shape, and `useI18n`'s API (it may be `t` only, no `locale` — adjust). Reuse existing class names from `styles/screens.css`/`design-system.css`; add a small `.completion`/`.cert-card` rule if needed (brand gradient background, centered card).

- [ ] **Step 4: Add the route.** In `router.tsx`, add before the catch-all `*`, inside the Protected/requireOnboarded group used by the other `/learn/...` routes:

```tsx
{ path: "/learn/:courseId/complete", element: <CompletionScreen /> },
```

Import `CompletionScreen` at the top.

- [ ] **Step 5: Auto-nav on completion.** In `QuizScreen.tsx`, on a passing submit whose response `progressPercent === 100`, navigate to the completion screen instead of back:

```tsx
// in the submit success handler, after result is shown / on "Продолжить":
if (result.passed && result.progressPercent === 100) {
  nav(`/learn/${courseId}/complete`);
} else if (result.passed) {
  nav(`/learn/${courseId}`);
}
```

Wire this into the existing "Продолжить" (passed) button handler; keep the failed → "Пересдать" path unchanged.

- [ ] **Step 6: Completed badge in My Learning.** In `LearningScreen.tsx`, for an enrollment whose `status === "COMPLETED"` (My Learning already reads `progressPercent`; also read `status`), render a tappable badge `t("learning.completedBadge")` linking to `/learn/:courseId/complete`.

- [ ] **Step 7: Typecheck.**
Run (from `mobile/`): `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 8: Commit.**
```bash
git add mobile/src/features/completion mobile/src/core/router.tsx mobile/src/features/quiz/QuizScreen.tsx mobile/src/features/learning/LearningScreen.tsx mobile/src/core/learning/learning.api.ts mobile/src/core/i18n/phase23.dict.ts
git commit -m "feat(completion): course-completed screen + route + entry points"
```

---

## Slice C — Admin quiz editor

### Task C1: Backend — UpsertQuizDto

**Files:**
- Create: `backend/src/admin/dto/upsert-quiz.dto.ts`

- [ ] **Step 1: Create the DTO.**

```ts
import { Type } from 'class-transformer';
import {
  ArrayMinSize, IsArray, IsBoolean, IsInt, IsOptional, IsString, Max, Min,
  MinLength, ValidateNested,
} from 'class-validator';

class OptionInput {
  @IsString() @MinLength(1) text!: string;
  @IsBoolean() isCorrect!: boolean;
}

class QuestionInput {
  @IsString() @MinLength(1) text!: string;
  @IsOptional() @IsString() explanation?: string;
  @IsArray() @ArrayMinSize(2) @ValidateNested({ each: true }) @Type(() => OptionInput)
  options!: OptionInput[];
}

export class UpsertQuizDto {
  @IsString() @MinLength(1) title!: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100)
  passingScore?: number;

  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => QuestionInput)
  questions!: QuestionInput[];
}
```

- [ ] **Step 2: Commit.**
```bash
git add backend/src/admin/dto/upsert-quiz.dto.ts
git commit -m "feat(admin): UpsertQuizDto"
```

### Task C2: Backend — AdminService quiz methods + getCourse include

**Files:**
- Modify: `backend/src/admin/admin.service.ts`
- Test: `backend/test/admin.e2e-spec.ts` (new — created in Task C3; service is exercised through the controller there)

- [ ] **Step 1: Extend `getCourse` include** so modules carry their quiz for editing. Replace the `modules` include in `getCourse` with:

```ts
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: { orderBy: { order: 'asc' } },
            quiz: {
              include: {
                questions: {
                  orderBy: { order: 'asc' },
                  include: { options: { orderBy: { order: 'asc' } } },
                },
              },
            },
          },
        },
```

- [ ] **Step 2: Add `upsertModuleQuiz` + `deleteModuleQuiz` + import `BadRequestException`.** Add `BadRequestException` to the `@nestjs/common` import. Add these methods to `AdminService`:

```ts
  async upsertModuleQuiz(moduleId: string, dto: UpsertQuizDto) {
    const module = await this.prisma.module.findUnique({ where: { id: moduleId } });
    if (!module) throw new NotFoundException('Module not found');

    // business rule beyond the DTO: exactly one correct option per question
    for (const q of dto.questions) {
      const correct = q.options.filter((o) => o.isCorrect).length;
      if (correct !== 1) {
        throw new BadRequestException('Each question needs exactly one correct option');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.quiz.findUnique({ where: { moduleId } });
      if (existing) await tx.quiz.delete({ where: { moduleId } }); // cascade removes Q/options

      return tx.quiz.create({
        data: {
          moduleId,
          title: dto.title,
          passingScore: dto.passingScore ?? 60,
          questions: {
            create: dto.questions.map((q, qi) => ({
              text: q.text,
              order: qi + 1,
              explanation: q.explanation,
              options: {
                create: q.options.map((o, oi) => ({
                  text: o.text,
                  isCorrect: o.isCorrect,
                  order: oi + 1,
                })),
              },
            })),
          },
        },
        include: {
          questions: {
            orderBy: { order: 'asc' },
            include: { options: { orderBy: { order: 'asc' } } },
          },
        },
      });
    });
  }

  async deleteModuleQuiz(moduleId: string) {
    const quiz = await this.prisma.quiz.findUnique({ where: { moduleId } });
    if (!quiz) throw new NotFoundException('Quiz not found');
    await this.prisma.quiz.delete({ where: { moduleId } });
    return { deleted: true };
  }
```

Import the DTO at the top: `import { UpsertQuizDto } from './dto/upsert-quiz.dto';`

- [ ] **Step 3: Build (compile check).**
Run (from `backend/`): `npm run build`
Expected: exit 0.

- [ ] **Step 4: Commit.**
```bash
git add backend/src/admin/admin.service.ts
git commit -m "feat(admin): module quiz upsert/delete + quiz in getCourse"
```

### Task C3: Backend — AdminController endpoints + e2e

**Files:**
- Modify: `backend/src/admin/admin.controller.ts`
- Test: `backend/test/admin.e2e-spec.ts` (new)

- [ ] **Step 1: Write the failing e2e.** Create `backend/test/admin.e2e-spec.ts`:

```ts
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Admin quiz editor (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let studentToken: string;
  let moduleId: string;

  const login = (email: string, password: string) =>
    request(app.getHttpServer()).post('/api/v1/auth/login').send({ email, password }).expect(200);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true, forbidNonWhitelisted: true, transform: true,
      transformOptions: { enableImplicitConversion: true },
    }));
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);
    adminToken = (await login('admin@demo.io', 'Admin123!')).body.accessToken;
    studentToken = (await login('student@demo.io', 'Student123!')).body.accessToken;
    const mod = await prisma.module.findFirstOrThrow({ orderBy: { order: 'asc' } });
    moduleId = mod.id;
  });

  afterAll(async () => { await app.close(); });

  const validQuiz = {
    title: 'Phase5 admin quiz',
    passingScore: 60,
    questions: [
      { text: 'Q1?', options: [{ text: 'A', isCorrect: true }, { text: 'B', isCorrect: false }] },
      { text: 'Q2?', explanation: 'because', options: [{ text: 'C', isCorrect: false }, { text: 'D', isCorrect: true }] },
    ],
  };

  it('PUT upserts a module quiz (admin)', async () => {
    const res = await request(app.getHttpServer())
      .put(`/api/v1/admin/modules/${moduleId}/quiz`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validQuiz)
      .expect(200);
    expect(res.body).toEqual(expect.objectContaining({ id: expect.any(String), title: 'Phase5 admin quiz' }));
    expect(res.body.questions).toHaveLength(2);
    expect(res.body.questions[0].options).toHaveLength(2);
  });

  it('GET admin course returns the quiz for editing', async () => {
    const mod = await prisma.module.findUniqueOrThrow({ where: { id: moduleId } });
    const res = await request(app.getHttpServer())
      .get(`/api/v1/admin/courses/${mod.courseId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const target = res.body.modules.find((m: { id: string }) => m.id === moduleId);
    expect(target.quiz.questions[0].options[0]).toEqual(
      expect.objectContaining({ isCorrect: expect.any(Boolean) }),
    );
  });

  it('rejects a question with no correct option (400)', async () => {
    await request(app.getHttpServer())
      .put(`/api/v1/admin/modules/${moduleId}/quiz`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'bad', questions: [{ text: 'Q', options: [{ text: 'A', isCorrect: false }, { text: 'B', isCorrect: false }] }] })
      .expect(400);
  });

  it('rejects a question with fewer than 2 options (400)', async () => {
    await request(app.getHttpServer())
      .put(`/api/v1/admin/modules/${moduleId}/quiz`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'bad', questions: [{ text: 'Q', options: [{ text: 'A', isCorrect: true }] }] })
      .expect(400);
  });

  it('forbids a non-admin (403)', async () => {
    await request(app.getHttpServer())
      .put(`/api/v1/admin/modules/${moduleId}/quiz`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send(validQuiz)
      .expect(403);
  });

  it('DELETE removes the quiz', async () => {
    await request(app.getHttpServer())
      .delete(`/api/v1/admin/modules/${moduleId}/quiz`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const gone = await prisma.quiz.findUnique({ where: { moduleId } });
    expect(gone).toBeNull();
  });
});
```

> Cleanup note: this suite mutates module 1's quiz. If module 1 has a seeded quiz you want preserved, point `moduleId` at a throwaway module instead, or re-seed after (`npm run db:seed` is idempotent). Simplest: run `npm run db:seed` after this suite during local dev.

- [ ] **Step 2: Run it, verify it fails.**
Run: `npm run test:e2e -- admin`
Expected: FAIL — routes 404 (not defined yet).

- [ ] **Step 3: Add the endpoints.** In `admin.controller.ts` add imports `Put` (from `@nestjs/common`) and `UpsertQuizDto`, then:

```ts
  @Put('modules/:moduleId/quiz')
  @HttpCode(HttpStatus.OK)
  upsertQuiz(@Param('moduleId') moduleId: string, @Body() dto: UpsertQuizDto) {
    return this.admin.upsertModuleQuiz(moduleId, dto);
  }

  @Delete('modules/:moduleId/quiz')
  deleteQuiz(@Param('moduleId') moduleId: string) {
    return this.admin.deleteModuleQuiz(moduleId);
  }
```

Add `HttpCode, HttpStatus, Put` to the `@nestjs/common` import and `import { UpsertQuizDto } from './dto/upsert-quiz.dto';`.

- [ ] **Step 4: Run it, verify it passes.**
Run: `npm run test:e2e -- admin`
Expected: PASS. Then re-seed: `npm run db:seed`.

- [ ] **Step 5: Commit.**
```bash
git add backend/src/admin/admin.controller.ts backend/test/admin.e2e-spec.ts
git commit -m "feat(admin): PUT/DELETE module quiz endpoints + e2e"
```

### Task C4: Admin UI — types + quiz editor in CourseFormModal

**Files:**
- Modify: `admin/app/(admin)/courses/types.ts`
- Modify: `admin/app/(admin)/courses/CourseFormModal.tsx`

- [ ] **Step 1: Extend types.** In `courses/types.ts`, add to the module type used by `AdminCourseDetail`:

```ts
export interface AdminQuizOption { id?: string; text: string; isCorrect: boolean }
export interface AdminQuizQuestion { id?: string; text: string; explanation?: string | null; options: AdminQuizOption[] }
export interface AdminQuiz { id?: string; title: string; passingScore: number; questions: AdminQuizQuestion[] }
// on the module type:
//   quiz?: AdminQuiz | null;
```

- [ ] **Step 2: Add the editor UI.** In `CourseFormModal.tsx`, under each module's lessons, render a collapsible "Тест" section bound to that module's `quiz` state (add `quiz` to the module state shape, defaulting to `null`). Controls:
  - "Добавить тест" (when null) → sets `quiz = { title: "", passingScore: 60, questions: [] }`; "Удалить тест" → sets `null`.
  - Quiz title input; passing-score number input (0–100).
  - Questions list: each has a text input, optional explanation input, an options list (each option: text input + a radio in a per-question group to mark the single correct one), "Добавить вариант"/remove-option, "Добавить вопрос"/remove-question.
  - Client validation flag per module: invalid if any question has ≠1 correct option, <2 options, or empty text. Surface inline and use it in Task C5 to block save.

Follow the existing module/lesson editor markup and `inputCls` styling already in the file.

- [ ] **Step 3: Typecheck.**
Run (from `admin/`): `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 4: Commit.**
```bash
git add "admin/app/(admin)/courses/types.ts" "admin/app/(admin)/courses/CourseFormModal.tsx"
git commit -m "feat(admin): quiz editor UI in course form"
```

### Task C5: Admin UI — persist quizzes on save

**Files:**
- Modify: `admin/app/(admin)/courses/CourseFormModal.tsx` (save handler)
- Modify: the admin API helper the form uses (same file or a `courses/api.ts` — follow how course POST/PATCH is currently called)

- [ ] **Step 1: Wire persistence.** In the save handler, after the course create/update succeeds and module ids are known (re-fetch the course via `GET /admin/courses/:id` if create didn't return module ids), for each module:
  - if it has a quiz definition → `PUT /admin/modules/:moduleId/quiz` with `{ title, passingScore, questions: questions.map(q => ({ text, explanation, options: q.options.map(o => ({ text, isCorrect })) })) }`.
  - if its quiz was removed (was present on load, now null) → `DELETE /admin/modules/:moduleId/quiz`.
  Use the same authed fetch/axios wrapper the form already uses for course calls. Block save (already-disabled button) if any module's quiz is client-invalid (from Task C4). Surface per-module errors inline.

- [ ] **Step 2: Typecheck + manual.**
Run (from `admin/`): `npx tsc --noEmit`
Expected: exit 0. (Manual: edit a course → add a quiz to a module → save → reopen → quiz persisted; remove it → save → gone.)

- [ ] **Step 3: Commit.**
```bash
git add "admin/app/(admin)/courses/CourseFormModal.tsx"
git commit -m "feat(admin): persist module quizzes on course save"
```

### Task C6: Full green + docs

**Files:**
- Modify: `README.md` (build status + learning-model note), `backend/README.md` if it lists endpoints
- Modify: project memory (see below)

- [ ] **Step 1: Run everything.**
```bash
cd backend && npm run build && npm run test:e2e && npm run db:seed
cd ../mobile && npx tsc --noEmit
cd ../admin && npx tsc --noEmit
```
Expected: backend build exit 0; all e2e suites PASS; both typechecks exit 0.

- [ ] **Step 2: Update README.** Add to "Build status": `✅ Phase 5 — Complete: student reviews, course-completion screen, admin quiz editor.` Add reviews/completion/admin-quiz notes to the learning-model + admin sections. Update the Tests count.

- [ ] **Step 3: Update memory.** Reflect Phase 5 in the EduStream project memory (payments already removed; now reviews-write + completion screen + admin quiz authoring exist).

- [ ] **Step 4: Commit.**
```bash
git add README.md backend/README.md docs
git commit -m "docs: Phase 5 (reviews, completion, admin quizzes)"
```

---

## Self-review notes

- **Spec coverage:** Reviews → A1–A3; Completion → B1–B3; Admin quiz editor → C1–C5; tests → A1, B2, C3; docs/memory → C6. All spec sections mapped.
- **Type consistency:** `completedAt` is `DateTime?` (Prisma) → `string | null` (API/TS). Quiz edit shape is identical in `getCourse` include (C2), `upsertModuleQuiz` return (C2), admin types (C4), and DTO (C1): `title`, `passingScore`, `questions[{ text, explanation?, options[{ text, isCorrect }] }]`.
- **Ordering:** `order` is always derived from array index (1-based) server-side — the client never sends `order`.
- **Known constraint:** quizzes attach to persisted modules only (the `updateCourse` curriculum-sync gap); new-course flow is create → edit → add quizzes. Surfaced in the admin UI copy (C4).
- **Test hygiene:** the admin e2e mutates a module quiz; re-run `npm run db:seed` after (idempotent) to restore demo state.
```
