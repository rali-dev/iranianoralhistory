import { VimeoId } from './vimeo-id.value-object';
import { DomainException } from '@iranianoralhistory/shared-contracts';

describe('VimeoId (Value Object)', () => {
  describe('create()', () => {
    it('accepts a valid numeric Vimeo ID', () => {
      const id = VimeoId.create('123456789');
      expect(id.toString()).toBe('123456789');
    });

    it('strips leading and trailing whitespace', () => {
      const id = VimeoId.create('  987654321  ');
      expect(id.toString()).toBe('987654321');
    });

    it('throws DomainException for alphabetic characters', () => {
      expect(() => VimeoId.create('abc123')).toThrow(DomainException);
    });

    it('throws DomainException for an empty string', () => {
      expect(() => VimeoId.create('')).toThrow(DomainException);
    });

    it('throws DomainException when the ID contains spaces', () => {
      expect(() => VimeoId.create('123 456')).toThrow(DomainException);
    });

    it('throws DomainException for special characters', () => {
      expect(() => VimeoId.create('123-456')).toThrow(DomainException);
    });

    it('includes the correct error message', () => {
      expect(() => VimeoId.create('invalid')).toThrow(
        'Invalid Vimeo ID: "invalid". Must be numeric.',
      );
    });
  });

  describe('isValid()', () => {
    it('returns true for purely numeric strings', () => {
      expect(VimeoId.isValid('123456')).toBe(true);
      expect(VimeoId.isValid('1')).toBe(true);
    });

    it('returns false for non-numeric strings', () => {
      expect(VimeoId.isValid('abc')).toBe(false);
      expect(VimeoId.isValid('')).toBe(false);
      expect(VimeoId.isValid('12a')).toBe(false);
      expect(VimeoId.isValid('12.3')).toBe(false);
    });
  });

  describe('toJSON()', () => {
    it('serialises correctly as a string', () => {
      const id = VimeoId.create('987654321');
      expect(id.toJSON()).toBe('987654321');
      expect(JSON.stringify({ vimeoId: id })).toBe('{"vimeoId":"987654321"}');
    });
  });
});
