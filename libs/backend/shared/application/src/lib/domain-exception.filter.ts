import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { DomainException } from '@iranianoralhistory/shared-contracts';

/**
 * Globaler Filter, der jede DomainException (verletzte Invariante aus der
 * Domänenschicht) auf HTTP 400 Bad Request mappt. Liegt im Shared-Backend,
 * damit er kontext-neutral in main.ts registriert werden kann.
 */
@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    response.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      message: exception.message,
      error: 'Bad Request',
    });
  }
}
