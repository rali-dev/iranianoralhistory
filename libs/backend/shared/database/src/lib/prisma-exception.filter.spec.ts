import { HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaExceptionFilter } from './prisma-exception.filter';

function buildHost(mockResponse: object) {
  return {
    switchToHttp: () => ({ getResponse: () => mockResponse }),
  } as never;
}

/**
 * We invoke filter.catch() directly, so a structurally-shaped error object is
 * enough — no need to reproduce the Prisma constructor signature.
 */
function knownError(code: string, meta?: Record<string, unknown>): Prisma.PrismaClientKnownRequestError {
  return { code, meta, message: 'prisma error', name: 'PrismaClientKnownRequestError' } as unknown as Prisma.PrismaClientKnownRequestError;
}

describe('PrismaExceptionFilter', () => {
  let filter: PrismaExceptionFilter;

  beforeEach(() => {
    filter = new PrismaExceptionFilter();
  });

  function run(exception: Prisma.PrismaClientKnownRequestError) {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    filter.catch(exception, buildHost({ status }));
    return { status, body: json.mock.calls[0]?.[0] };
  }

  it('maps a P2002 unique violation to 409 Conflict', () => {
    const { status, body } = run(knownError('P2002', { target: ['vimeoId'] }));

    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(body).toMatchObject({ statusCode: 409, error: 'Conflict' });
    expect(body.message).toContain('Vimeo');
  });

  it('derives a vimeo-specific message even when target is the constraint name', () => {
    const { body } = run(knownError('P2002', { target: 'Video_vimeoId_key' }));
    expect(body.message).toContain('Vimeo');
  });

  it('derives a slug-specific message for a slug unique violation', () => {
    const { status, body } = run(knownError('P2002', { target: ['slug'] }));

    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(body.message.toLowerCase()).toContain('slug');
  });

  it('derives an email-specific message for an email unique violation', () => {
    const { status, body } = run(knownError('P2002', { target: ['email'] }));

    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(body.message.toLowerCase()).toContain('email');
  });

  it('falls back to a generic conflict message for an unrecognised unique field', () => {
    const { status, body } = run(knownError('P2002', { target: ['someOtherColumn'] }));

    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(body.message).toBe('A record with the same unique value already exists.');
  });

  it('falls back to the generic conflict message when target is neither array nor string', () => {
    const { body } = run(knownError('P2002', { target: undefined }));

    expect(body.message).toBe('A record with the same unique value already exists.');
  });

  it('maps a P2025 missing-record error to 404 Not Found', () => {
    const { status, body } = run(knownError('P2025'));

    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(body.statusCode).toBe(404);
    expect(body.message).toBe('The requested record was not found.');
  });

  it('surfaces the Prisma cause as the 404 message when present', () => {
    const { body } = run(knownError('P2025', { cause: 'Record to update not found.' }));

    expect(body.message).toBe('Record to update not found.');
  });

  it('maps a P2003 foreign-key error to 400 Bad Request', () => {
    const { status } = run(knownError('P2003'));
    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
  });

  it('falls back to 500 for an unmapped Prisma code', () => {
    const { status } = run(knownError('P2000'));
    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
  });
});
