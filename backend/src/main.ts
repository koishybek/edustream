import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  validateEnv(config);

  // Security headers. CORP disabled so the cross-origin SPA/admin can read the API.
  app.use(helmet({ crossOriginResourcePolicy: false }));

  // All routes live under /api/v1
  app.setGlobalPrefix('api/v1');

  // Validate + strip unknown fields on every request body/query.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Consistent error envelope; never leak stack traces to clients.
  app.useGlobalFilters(new HttpExceptionFilter());

  // Flush Prisma connections cleanly on SIGTERM (Railway redeploys, etc.).
  app.enableShutdownHooks();

  // CORS for the admin (Next.js) and mobile (Vite) hosts. In production we fail
  // closed: an explicit CORS_ORIGINS is required (no wildcard reflection).
  const isProd = config.get('NODE_ENV') === 'production';
  const origins = (config.get<string>('CORS_ORIGINS') ?? (isProd ? '' : '*'))
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin:
      !isProd && (origins.length === 0 || origins.includes('*'))
        ? true
        : origins,
    credentials: true,
  });

  const port = Number(config.get('PORT') ?? 4000);
  // Bind all interfaces so container platforms (Railway, etc.) can route to it.
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`EduStream API listening on port ${port} (prefix /api/v1)`);
}

/** Fail fast on obviously-insecure production configuration. */
function validateEnv(config: ConfigService): void {
  if (config.get('NODE_ENV') !== 'production') return;
  const errors: string[] = [];
  const access = config.get<string>('JWT_ACCESS_SECRET') ?? '';
  const refresh = config.get<string>('JWT_REFRESH_SECRET') ?? '';
  const cors = config.get<string>('CORS_ORIGINS') ?? '';
  const weak = (s: string) => s.length < 32 || /change-?me|placeholder|example/i.test(s);
  if (weak(access)) errors.push('JWT_ACCESS_SECRET missing/weak (need ≥32 chars, no placeholder)');
  if (weak(refresh)) errors.push('JWT_REFRESH_SECRET missing/weak (need ≥32 chars, no placeholder)');
  if (access && access === refresh) errors.push('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must differ');
  if (!cors || cors.split(',').map((s) => s.trim()).includes('*'))
    errors.push('CORS_ORIGINS must be explicit origins in production (no "*")');
  if (errors.length) {
    throw new Error(`Insecure production config:\n - ${errors.join('\n - ')}`);
  }
}

void bootstrap();
