import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

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

  // CORS for the admin (Next.js) and mobile dev hosts.
  const corsOrigins = (config.get<string>('CORS_ORIGINS') ?? '*')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: corsOrigins.includes('*') ? true : corsOrigins,
    credentials: true,
  });

  const port = Number(config.get('PORT') ?? 4000);
  // Bind all interfaces so container platforms (Railway, etc.) can route to it.
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`EduStream API listening on port ${port} (prefix /api/v1)`);
}

void bootstrap();
