# EduStream — User Guide

EduStream is a mobile-first EdTech platform for **ESG / sustainability education**
(RU / EN / KZ). Free courses, real video lessons, module quizzes that gate progress,
completion screens, and reviews — plus a web admin.

## Live demo

| App | URL | Login |
|---|---|---|
| 📱 **Student app (PWA)** | https://mobile-three-tau.vercel.app | `student@demo.io` / `Student123!` |
| 🛠 **Admin** | https://admin-azure-five-52.vercel.app | `admin@demo.io` / `Admin123!` |

> The frontends are hosted permanently on Vercel. During the demo the API runs
> through a temporary tunnel from the dev machine — see **Hosting notes** at the end
> for making it 24/7 on Railway.

---

## Part 1 — Student app

### 1. Sign in / register
- Open the student URL. First visit shows a short 3-slide **intro** — tap **Далее** or **Пропустить**.
- **Log in** with the demo student, or tap **Регистрация** to create a new account
  (name + email + password).
- New accounts go through **onboarding**: pick interests + a knowledge level. This
  personalises the experience and is required once.
- Language: switch **RU / EN / KZ** from the Profile tab any time.

### 2. Browse the catalog (Home tab)
- **Search** courses by title/description in the top field.
- **Category chips** (ESG-reporting, Climate, Water, Biodiversity, Social, Circular
  economy) filter instantly.
- **Filters** (sliders icon): category, level, duration, sort (popular / rating / newest).
- **Рекомендуем вам** = top-rated picks; **Все курсы** = the full grid. Every card shows
  a real cover image, rating, duration, level, and "Бесплатно".

### 3. Course detail
- Tap any course → cover hero, rating, instructor, description, and the full
  **curriculum** (modules → lessons, with a "Тест модуля · N вопросов" row per module).
- **Отзывы**: read reviews; if you're enrolled, leave/update **your own** (1–5 stars + text).
- CTA at the bottom: **Записаться бесплатно** (enroll) → **Продолжить** once enrolled.

### 4. Learn (the core loop)
- After enrolling, open the course from **Обучение** (My Learning) or the course CTA.
- The **player** streams the real lesson video (YouTube: TED / TED-Ed / Kurzgesagt /
  Ellen MacArthur Foundation).
- Tap **Урок пройден** to mark a lesson complete — progress updates live.
- After a module's lessons are done, a **Пройти тест модуля** button appears.

### 5. Module quizzes (gate progress)
- Single-screen multiple-choice quiz. Answer all questions → **Проверить ответы**.
- Result shows your score, per-question right/wrong, and explanations.
- **Passed** (≥ pass mark, default 60%) → the module counts as complete. **Failed** →
  **Пересдать**. A module is only complete when its lessons are watched **and** its quiz
  is passed. Progress = (done lessons + passed quizzes) ÷ (all lessons + all quizzes).

### 6. Completion 🎓
- Reaching **100%** opens the **«Курс пройден»** capstone screen (your name, course,
  date). It's reachable both by passing the final quiz and by finishing lessons.
- Completed courses show a **«Курс пройден»** badge in My Learning.

### 7. Reviews
- On any course you're enrolled in, the **«Ваш отзыв»** block lets you rate + comment.
  One review per user, editable any time; the course rating updates immediately.

### 8. Profile & PWA install
- **Профиль** tab: your info, language switch, My courses, sign out.
- It's an installable **PWA** — in a mobile/desktop browser choose **"Add to Home
  Screen" / "Install"** to run it like a native app (works offline for cached shells).

**Quick demo path:** log in → open a course → *Записаться бесплатно* → watch a lesson →
*Урок пройден* → *Пройти тест модуля* → answer → complete → leave a review.

---

## Part 2 — Admin

Open the admin URL, sign in with the admin account.

- **Dashboard** — live stats: total users, courses, published courses, enrollments.
- **Courses** — table of all courses (status, level, rating, modules, enrollments).
  Create a new course with the form (title, slug, description, category, instructor,
  level, cover, modules + lessons).
- **Users** — table of all users with roles.
- Everything is **role-guarded**: only ADMIN accounts can reach `/admin`.

---

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Student | `student@demo.io` | `Student123!` |
| Admin | `admin@demo.io` | `Admin123!` |

The demo student is pre-enrolled in *The Architecture of Circular Economies* at 38%
(module 1 lessons done, quiz pending) so the video → quiz → progress loop is ready to show.

---

## Hosting notes (making it permanent)

Right now: **frontends on Vercel (permanent)**, **API + Postgres via a temporary tunnel
from the dev machine** (works while that machine + tunnel are running).

To make the API 24/7 (repo already on GitHub at `koishybek/edustream`, configs ready):
1. Follow **[DEPLOY.md](DEPLOY.md)** to deploy the backend + Postgres to **Railway**
   (~15 min; set a strong admin via `ADMIN_EMAIL` / `ADMIN_PASSWORD` — the demo admin is
   dev-only and never seeded in production).
2. In both Vercel projects, change the API env var to the Railway URL and redeploy:
   - Student app: `VITE_API_BASE_URL = https://<railway>/api/v1`
   - Admin: `NEXT_PUBLIC_API_BASE_URL = https://<railway>/api/v1`
3. Set the backend `CORS_ORIGINS` to the two Vercel URLs.

That's it — a fully hosted, production-hardened build.
