import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

/**
 * Maps every thrown error to the project-wide error envelope:
 *   { error: { code, message, details? }, path, timestamp }
 * Validation errors (class-validator) collapse into a single message + details.
 * Unknown errors are logged server-side and returned as a generic 500 — no
 * stack traces ever reach the client.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpException');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Something went wrong';
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (res && typeof res === 'object') {
        const body = res as Record<string, unknown>;
        if (Array.isArray(body.message)) {
          message = 'Validation failed';
          details = body.message;
        } else if (typeof body.message === 'string') {
          message = body.message;
        }
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const mapped = mapPrismaError(exception);
      status = mapped.status;
      message = mapped.message;
      if (status >= 500) {
        this.logger.error(`Prisma ${exception.code}: ${exception.message}`);
      }
    } else {
      this.logger.error(
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      error: {
        code: codeFromStatus(status),
        message,
        ...(details ? { details } : {}),
      },
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}

/** Map Prisma known-request errors to sane HTTP statuses (not a blanket 500). */
function mapPrismaError(e: Prisma.PrismaClientKnownRequestError): {
  status: number;
  message: string;
} {
  switch (e.code) {
    case 'P2002': {
      const target = Array.isArray(e.meta?.target)
        ? (e.meta.target as string[]).join(', ')
        : undefined;
      return {
        status: HttpStatus.CONFLICT,
        message: target
          ? `A record with this ${target} already exists`
          : 'Resource already exists',
      };
    }
    case 'P2003':
      return {
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        message: 'A referenced record does not exist',
      };
    case 'P2025':
      return { status: HttpStatus.NOT_FOUND, message: 'Record not found' };
    default:
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Something went wrong',
      };
  }
}

function codeFromStatus(status: number): string {
  const map: Record<number, string> = {
    [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
    [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
    [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
    [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
    [HttpStatus.CONFLICT]: 'CONFLICT',
    [HttpStatus.UNPROCESSABLE_ENTITY]: 'UNPROCESSABLE_ENTITY',
    [HttpStatus.TOO_MANY_REQUESTS]: 'TOO_MANY_REQUESTS',
    [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_ERROR',
  };
  return map[status] ?? 'ERROR';
}
