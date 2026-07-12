import { Email } from './email.value-object';

describe('Email (Value Object)', () => {
  describe('create()', () => {
    it('accepts a valid email address', () => {
      const email = Email.create('user@example.de');
      expect(email.toString()).toBe('user@example.de');
    });

    it('normalises email addresses to lowercase', () => {
      const email = Email.create('USER@EXAMPLE.DE');
      expect(email.toString()).toBe('user@example.de');
    });

    it('strips leading and trailing whitespace', () => {
      const email = Email.create('  user@example.de  ');
      expect(email.toString()).toBe('user@example.de');
    });

    it('throws on missing domain', () => {
      expect(() => Email.create('no-at-sign')).toThrow(
        'Invalid email address: "no-at-sign"',
      );
    });

    it('throws when the @ sign is missing', () => {
      expect(() => Email.create('username')).toThrow();
    });

    it('throws on empty string', () => {
      expect(() => Email.create('')).toThrow();
    });

    it('throws when the address contains a space', () => {
      expect(() => Email.create('user @example.de')).toThrow();
    });
  });

  describe('isValid()', () => {
    it('returns true for valid email addresses', () => {
      expect(Email.isValid('a@b.de')).toBe(true);
      expect(Email.isValid('user.name+tag@sub.domain.com')).toBe(true);
    });

    it('returns false for invalid email addresses', () => {
      expect(Email.isValid('no-at')).toBe(false);
      expect(Email.isValid('@domain.de')).toBe(false);
      expect(Email.isValid('user@')).toBe(false);
      expect(Email.isValid('')).toBe(false);
    });
  });

  describe('toJSON()', () => {
    it('serialises correctly as a string', () => {
      const email = Email.create('test@example.com');
      expect(email.toJSON()).toBe('test@example.com');
    });

    it('is compatible with JSON.stringify', () => {
      const email = Email.create('test@example.com');
      expect(JSON.stringify({ email })).toBe('{"email":"test@example.com"}');
    });
  });
});
