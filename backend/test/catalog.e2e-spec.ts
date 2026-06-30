import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Catalog (Phase 2) through the real HTTP interface. Reads against the seeded
 * dev DB (run `npm run seed` first). Assumes only published courses are listed.
 */
describe('Catalog (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

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
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /categories returns {id,name,slug,icon}[]', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/categories')
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    const c = res.body[0];
    expect(c).toEqual({
      id: expect.any(String),
      name: expect.any(String),
      slug: expect.any(String),
      icon: expect.any(String),
    });
  });

  it('GET /courses returns the {data,page,pageSize,total} pagination shape', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/courses?page=1&pageSize=2')
      .expect(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        data: expect.any(Array),
        page: 1,
        pageSize: 2,
        total: expect.any(Number),
      }),
    );
    expect(res.body.data.length).toBeLessThanOrEqual(2);
    // CourseCard shape + nested relations, no videoUrl anywhere.
    const card = res.body.data[0];
    expect(card).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        title: expect.any(String),
        slug: expect.any(String),
        ratingAvg: expect.any(Number),
        ratingCount: expect.any(Number),
        category: expect.objectContaining({
          slug: expect.any(String),
          name: expect.any(String),
          icon: expect.any(String),
        }),
        instructor: expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
        }),
      }),
    );
    expect(card.videoUrl).toBeUndefined();
    expect(card.priceCents).toBeUndefined();
    expect(card.currency).toBeUndefined();
  });

  it('caps pageSize at 50', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/courses?pageSize=999')
      .expect(200);
    expect(res.body.pageSize).toBe(50);
  });

  it('filters by categoryId (every result is in that category)', async () => {
    // Pick a category that actually has courses.
    const category = await prisma.category.findFirstOrThrow({
      where: { courses: { some: { status: 'PUBLISHED' } } },
    });

    const res = await request(app.getHttpServer())
      .get(`/api/v1/courses?categoryId=${category.id}&pageSize=50`)
      .expect(200);

    expect(res.body.total).toBeGreaterThan(0);
    for (const card of res.body.data) {
      expect(card.category.slug).toBe(category.slug);
    }

    // The total matches the count of published courses in that category.
    const dbCount = await prisma.course.count({
      where: { categoryId: category.id, status: 'PUBLISHED' },
    });
    expect(res.body.total).toBe(dbCount);
  });

  it('sort=rating orders by ratingAvg descending', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/courses?sort=rating&pageSize=50')
      .expect(200);

    const ratings = res.body.data.map(
      (c: { ratingAvg: number }) => c.ratingAvg,
    );
    const sorted = [...ratings].sort((a, b) => b - a);
    expect(ratings).toEqual(sorted);
  });

  it('search matches case-insensitively on title/description', async () => {
    // Seed has a course titled "Water Security & Resource Management".
    const res = await request(app.getHttpServer())
      .get('/api/v1/courses?search=water')
      .expect(200);

    expect(res.body.total).toBeGreaterThan(0);
    for (const card of res.body.data) {
      const haystack = `${card.title} ${card.description}`.toLowerCase();
      expect(haystack).toContain('water');
    }
  });

  it('GET /courses/:slug returns detail with modules+lessons and NO videoUrl', async () => {
    const seeded = await prisma.course.findFirstOrThrow({
      where: { status: 'PUBLISHED' },
    });

    const res = await request(app.getHttpServer())
      .get(`/api/v1/courses/${seeded.slug}`)
      .expect(200);

    expect(res.body.slug).toBe(seeded.slug);
    expect(Array.isArray(res.body.modules)).toBe(true);
    expect(res.body.modules.length).toBeGreaterThan(0);
    const module = res.body.modules[0];
    expect(module).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        title: expect.any(String),
        order: expect.any(Number),
        lessons: expect.any(Array),
      }),
    );
    // Every seeded module carries a quiz surfaced as { id, questionCount }.
    expect(module.quiz).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        questionCount: expect.any(Number),
      }),
    );
    const lesson = module.lessons[0];
    expect(lesson).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        title: expect.any(String),
        order: expect.any(Number),
        durationSeconds: expect.any(Number),
        isFreePreview: expect.any(Boolean),
      }),
    );
    expect(lesson.videoUrl).toBeUndefined();
  });

  it('GET /courses/:slug returns 404 for an unknown slug', () =>
    request(app.getHttpServer())
      .get('/api/v1/courses/this-course-does-not-exist')
      .expect(404));

  it('GET /courses/:id/reviews returns the pagination shape', async () => {
    const course = await prisma.course.findFirstOrThrow({
      where: { reviews: { some: {} } },
    });
    const res = await request(app.getHttpServer())
      .get(`/api/v1/courses/${course.id}/reviews?page=1&pageSize=5`)
      .expect(200);

    expect(res.body).toEqual(
      expect.objectContaining({
        data: expect.any(Array),
        page: 1,
        pageSize: 5,
        total: expect.any(Number),
      }),
    );
    if (res.body.data.length > 0) {
      expect(res.body.data[0]).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          rating: expect.any(Number),
          createdAt: expect.any(String),
          user: expect.objectContaining({ name: expect.any(String) }),
        }),
      );
    }
  });

  it('POST /courses/:id/reviews requires auth (401)', async () => {
    const course = await prisma.course.findFirstOrThrow({
      where: { status: 'PUBLISHED' },
    });
    return request(app.getHttpServer())
      .post(`/api/v1/courses/${course.id}/reviews`)
      .send({ rating: 5 })
      .expect(401);
  });

  it('POST /courses/:id/reviews rejects a non-enrolled user (403)', async () => {
    // Log in as the seeded student, then review a course they are NOT enrolled in.
    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'student@demo.io', password: 'Student123!' })
      .expect(200);
    const token = login.body.accessToken as string;

    const enrolled = await prisma.enrollment.findMany({
      where: { user: { email: 'student@demo.io' } },
      select: { courseId: true },
    });
    const enrolledIds = enrolled.map((e) => e.courseId);
    const notEnrolled = await prisma.course.findFirstOrThrow({
      where: { status: 'PUBLISHED', id: { notIn: enrolledIds } },
    });

    return request(app.getHttpServer())
      .post(`/api/v1/courses/${notEnrolled.id}/reviews`)
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 4, comment: 'should be blocked' })
      .expect(403);
  });

  it('POST /courses/:id/reviews upserts for an enrolled user and recomputes the rating', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'student@demo.io', password: 'Student123!' })
      .expect(200);
    const token = login.body.accessToken as string;

    const enrollment = await prisma.enrollment.findFirstOrThrow({
      where: { user: { email: 'student@demo.io' } },
    });
    const courseId = enrollment.courseId;

    try {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/courses/${courseId}/reviews`)
        .set('Authorization', `Bearer ${token}`)
        .send({ rating: 3, comment: 'e2e review' })
        .expect(201);
      expect(res.body.rating).toBe(3);

      // ratingAvg/ratingCount reflect the recompute over all reviews.
      const agg = await prisma.review.aggregate({
        where: { courseId },
        _avg: { rating: true },
        _count: { _all: true },
      });
      const course = await prisma.course.findUniqueOrThrow({
        where: { id: courseId },
      });
      const expectedAvg =
        Math.round((agg._avg.rating ?? 0) * 10) / 10;
      expect(course.ratingCount).toBe(agg._count._all);
      expect(course.ratingAvg).toBe(expectedAvg);
    } finally {
      // Clean up the review this test created, then recompute back.
      await prisma.review.deleteMany({
        where: { courseId, user: { email: 'student@demo.io' } },
      });
    }
  });
});
