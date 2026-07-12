import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';

/**
 * Translates Prisma persistence errors into meaningful HTTP responses at the
 * adapter boundary. Without it, a violated database constraint (e.g. a duplicate
 * `vimeoId` or `slug`) escapes as an opaque HTTP 500. Registered globally, it
 * covers every bounded context (video, collection, identity, …) through a single
 * class identity, so the domain layer stays free of persistence concerns.
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    switch (exception.code) {
      // Unique constraint failed → 409 Conflict
      case 'P2002': {
        response.status(HttpStatus.CONFLICT).json({
          statusCode: HttpStatus.CONFLICT,
          message: this.uniqueMessage(exception),
          error: 'Conflict',
        });
        return;
      }
      // An operation depended on a record that no longer exists → 404 Not Found
      case 'P2025': {
        response.status(HttpStatus.NOT_FOUND).json({
          statusCode: HttpStatus.NOT_FOUND,
          message: (exception.meta?.['cause'] as string) ?? 'The requested record was not found.',
          error: 'Not Found',
        });
        return;
      }
      // Foreign-key constraint failed → 400 Bad Request
      case 'P2003': {
        response.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'The operation references a related record that does not exist.',
          error: 'Bad Request',
        });
        return;
      }
      default: {
        response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'A database error occurred.',
          error: 'Internal Server Error',
        });
      }
    }
  }

  /**
   * Builds a human-readable message from the violated unique constraint's fields.
   * On PostgreSQL `meta.target` is the field list (string[]) or the constraint
   * name (string, e.g. "Video_vimeoId_key") — both are handled defensively.
   */
  private uniqueMessage(exception: Prisma.PrismaClientKnownRequestError): string {
    const target = exception.meta?.['target'];
    const fields = Array.isArray(target)
      ? target.map(String)
      : typeof target === 'string'
        ? [target]
        : [];
    const matches = (needle: string) => fields.some((f) => f.toLowerCase().includes(needle));

    if (matches('vimeoid')) return 'This Vimeo ID is already used by another video.';
    if (matches('slug')) return 'This slug is already used by another entry.';
    if (matches('email')) return 'This email address is already registered.';
    return 'A record with the same unique value already exists.';
  }
}
