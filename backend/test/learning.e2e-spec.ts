import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Learning loop (Phase 3, production-real): free enrollment, video progress,
 * and module quizzes that gate progress. Runs against the seeded dev DB
 * (`npm run db:seed`).
 */
describe('Learning + Quizzes (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let courseId: string;

  const login = (email: string, password: string) =>
    request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);

    const res = await login('student@demo.io', 'Student123!');
    token = res.body.accessToken as string;

    // A published course the student is NOT pre-enrolled in.
    const enrolled = await prisma.enrollment.findMany({
      where: { user: { email: 'student@demo.io' } },
      select: { courseId: true },
    });
    const notEnrolled = await prisma.course.findFirstOrThrow({
      where: {
        status: 'PUBLISHED',
        id: { notIn: enrolled.map((e) => e.courseId) },
        modules: { some: { quiz: { isNot: null } } },
      },
    });
    courseId = notEnrolled.id;
  });

  afterAll(async () => {
    // Clean up the enrollment (+ cascade) this suite created.
    await prisma.enrollment.deleteMany({
      where: { courseId, user: { email: 'student@demo.io' } },
    });
    await app.close();
  });

  it('POST /courses/:id/enroll is free and idempotent', async () => {
    const first = await request(app.getHttpServer())
      .post(`/api/v1/courses/${courseId}/enroll`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(first.body).toEqual(
      expect.objectContaining({
        enrollmentId: expect.any(String),
        alreadyEnrolled: false,
      }),
    );

    const second = await request(app.getHttpServer())
      .post(`/api/v1/courses/${courseId}/enroll`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(second.body.alreadyEnrolled).toBe(true);
    expect(second.body.enrollmentId).toBe(first.body.enrollmentId);
  });

  it('GET progress returns modules with lessons (videoUrl) + quiz status', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/me/courses/${courseId}/progress`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toEqual(
      expect.objectContaining({
        progressPercent: expect.any(Number),
        status: expect.any(String),
        modules: expect.any(Array),
      }),
    );
    const mod = res.body.modules[0];
    expect(mod.lessons[0]).toEqual(
      expect.objectContaining({
        lessonId: expect.any(String),
        videoUrl: expect.any(String),
        completed: false,
      }),
    );
    expect(mod.quiz).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        questionCount: expect.any(Number),
        passed: false,
      }),
    );
  });

  it('GET quiz never leaks isCorrect', async () => {
    const quizId = await firstQuizId();
    const res = await request(app.getHttpServer())
      .get(`/api/v1/me/courses/${courseId}/quiz/${quizId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.questions.length).toBeGreaterThan(0);
    for (const q of res.body.questions) {
      for (const o of q.options) {
        expect(o.isCorrect).toBeUndefined();
        expect(o).toEqual(
          expect.objectContaining({ id: expect.any(String), text: expect.any(String) }),
        );
      }
    }
  });

  it('wrong answers do not pass and do not complete the module', async () => {
    const quizId = await firstQuizId();
    const answers = await wrongAnswers(quizId);

    const res = await request(app.getHttpServer())
      .post(`/api/v1/me/courses/${courseId}/quiz/${quizId}/submit`)
      .set('Authorization', `Bearer ${token}`)
      .send({ answers })
      .expect(200);

    expect(res.body.passed).toBe(false);
    expect(res.body.score).toBeLessThan(res.body.passingScore);

    const prog = await prisma.enrollment.findFirstOrThrow({
      where: { courseId, user: { email: 'student@demo.io' } },
    });
    // No passed quiz, no completed lessons yet → 0%.
    expect(prog.progressPercent).toBe(0);
  });

  it('correct answers pass the quiz and increase progress', async () => {
    const quizId = await firstQuizId();
    const answers = await correctAnswers(quizId);

    const before = await prisma.enrollment.findFirstOrThrow({
      where: { courseId, user: { email: 'student@demo.io' } },
    });

    const res = await request(app.getHttpServer())
      .post(`/api/v1/me/courses/${courseId}/quiz/${quizId}/submit`)
      .set('Authorization', `Bearer ${token}`)
      .send({ answers })
      .expect(200);

    expect(res.body.passed).toBe(true);
    expect(res.body.score).toBe(100);
    expect(res.body.progressPercent).toBeGreaterThan(before.progressPercent);

    // The quiz now reads as passed on the progress endpoint.
    const prog = await request(app.getHttpServer())
      .get(`/api/v1/me/courses/${courseId}/progress`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const mod = prog.body.modules.find(
      (m: { quiz?: { id: string } }) => m.quiz?.id === quizId,
    );
    expect(mod.quiz.passed).toBe(true);
  });

  it('rejects a quiz GET from a non-enrolled user (403)', async () => {
    const quizId = await firstQuizId();
    const other = await login('marat@demo.io', 'Reviewer123!');
    return request(app.getHttpServer())
      .get(`/api/v1/me/courses/${courseId}/quiz/${quizId}`)
      .set('Authorization', `Bearer ${other.body.accessToken}`)
      .expect(403);
  });

  it('completing all lessons + quizzes sets completedAt and COMPLETED', async () => {
    const lessons = await prisma.lesson.findMany({
      where: { module: { courseId } },
    });
    for (const l of lessons) {
      await request(app.getHttpServer())
        .post(`/api/v1/lessons/${l.id}/progress`)
        .set('Authorization', `Bearer ${token}`)
        .send({ completed: true, watchedSeconds: l.durationSeconds })
        .expect(201);
    }

    const quizzes = await prisma.quiz.findMany({
      where: { module: { courseId } },
    });
    for (const qz of quizzes) {
      const questions = await prisma.question.findMany({
        where: { quizId: qz.id },
        include: { options: true },
      });
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

    // completedAt is stamped once and stable on a later recompute.
    const firstCompletedAt = res.body.completedAt as string;
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

  // ---- helpers (read correct answers straight from the DB) ----

  async function firstQuizId(): Promise<string> {
    const mod = await prisma.module.findFirstOrThrow({
      where: { courseId, quiz: { isNot: null } },
      orderBy: { order: 'asc' },
      include: { quiz: true },
    });
    return mod.quiz!.id;
  }

  async function correctAnswers(quizId: string) {
    const questions = await prisma.question.findMany({
      where: { quizId },
      include: { options: true },
    });
    return questions.map((q) => ({
      questionId: q.id,
      optionId: q.options.find((o) => o.isCorrect)!.id,
    }));
  }

  async function wrongAnswers(quizId: string) {
    const questions = await prisma.question.findMany({
      where: { quizId },
      include: { options: true },
    });
    return questions.map((q) => ({
      questionId: q.id,
      optionId: q.options.find((o) => !o.isCorrect)!.id,
    }));
  }
});
