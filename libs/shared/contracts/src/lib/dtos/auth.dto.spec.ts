import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { RegisterDto, LoginDto, VerifyResetCodeDto, ResetPasswordDto } from './auth.dto';

/** Returns the list of top-level properties that failed validation. */
function failedProps<T extends object>(cls: new () => T, payload: unknown): string[] {
  const dto = plainToInstance(cls, payload);
  return validateSync(dto as object, { whitelist: true }).map((e) => e.property);
}

describe('auth DTO validation', () => {
  describe('RegisterDto', () => {
    it('accepts a well-formed email + password', () => {
      expect(failedProps(RegisterDto, { email: 'user@example.com', password: 'secret12' })).toEqual([]);
    });

    it('rejects a malformed email', () => {
      expect(failedProps(RegisterDto, { email: 'not-an-email', password: 'secret12' })).toContain('email');
    });

    it('rejects a password shorter than 8 characters', () => {
      expect(failedProps(RegisterDto, { email: 'user@example.com', password: 'short' })).toContain('password');
    });

    it('rejects a password longer than 20 characters', () => {
      expect(failedProps(RegisterDto, { email: 'user@example.com', password: 'x'.repeat(21) })).toContain('password');
    });

    it('rejects a missing password', () => {
      expect(failedProps(RegisterDto, { email: 'user@example.com' })).toContain('password');
    });
  });

  describe('LoginDto', () => {
    it('accepts any non-empty password (no length bound on login)', () => {
      expect(failedProps(LoginDto, { email: 'user@example.com', password: 'x' })).toEqual([]);
    });

    it('rejects an empty password', () => {
      expect(failedProps(LoginDto, { email: 'user@example.com', password: '' })).toContain('password');
    });
  });

  describe('VerifyResetCodeDto', () => {
    it('accepts an exactly-6-character code', () => {
      expect(failedProps(VerifyResetCodeDto, { email: 'user@example.com', code: '123456' })).toEqual([]);
    });

    it('rejects a code that is not 6 characters', () => {
      expect(failedProps(VerifyResetCodeDto, { email: 'user@example.com', code: '123' })).toContain('code');
    });
  });

  describe('ResetPasswordDto', () => {
    it('accepts a valid email + 6-digit code + bounded password', () => {
      expect(
        failedProps(ResetPasswordDto, { email: 'user@example.com', code: '123456', newPassword: 'secret12' }),
      ).toEqual([]);
    });

    it('rejects a too-short new password', () => {
      expect(
        failedProps(ResetPasswordDto, { email: 'user@example.com', code: '123456', newPassword: 'no' }),
      ).toContain('newPassword');
    });
  });
});
