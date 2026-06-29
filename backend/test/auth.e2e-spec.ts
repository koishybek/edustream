import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Auth flow through the real HTTP interface (boots the app + dev DB).
 * Creates a throwaway user and cleans it up afterwards.
 */
describe('Auth flow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const email = `e2e_${Date.now()}@test.edustream.local`;
  const password = 'Sup3rSecret!';
  let accessToken = '';
  let refreshToken = '';

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
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { contains: '@test.edustream.local' } },
    });
    await app.close();
  });

  it('registers a user, hashes the password, returns tokens (no hash leaked)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password, name: 'E2E User' })
      .expect(201);

    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.refreshToken).toEqual(expect.any(String));
    expect(res.body.user.email).toBe(email);
    expect(res.body.user.role).toBe('STUDENT');
    expect(res.body.user.passwordHash).toBeUndefined();
    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;

    const dbUser = await prisma.user.findUnique({ where: { email } });
    expect(dbUser?.passwordHash).toBeTruthy();
    expect(dbUser?.passwordHash).not.toBe(password);
  });

  it('rejects duplicate registration (409)', () =>
    request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password, name: 'Dupe' })
      .expect(409));

  it('rejects an invalid registration payload (400)', () =>
    request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'not-an-email', password: 'short', name: '' })
      .expect(400));

  it('logs in with correct credentials (200)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
  });

  it('rejects a wrong password (401)', () =>
    request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'wrong-password' })
      .expect(401));

  it('returns the current user from GET /me (200)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(res.body.email).toBe(email);
    expect(res.body.passwordHash).toBeUndefined();
  });

  it('rejects GET /me without a token (401)', () =>
    request(app.getHttpServer()).get('/api/v1/auth/me').expect(401));

  it('issues a new access token from a valid refresh token (200)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken })
      .expect(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
  });

  it('updates onboarding fields via PATCH /me (200)', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        interests: ['climate', 'water'],
        knowledgeLevel: 'BEGINNER',
        locale: 'kz',
      })
      .expect(200);
    expect(res.body.interests).toEqual(['climate', 'water']);
    expect(res.body.knowledgeLevel).toBe('BEGINNER');
    expect(res.body.locale).toBe('kz');
  });
});
