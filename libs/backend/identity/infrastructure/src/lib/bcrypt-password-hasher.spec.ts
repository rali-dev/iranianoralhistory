import { BcryptPasswordHasher } from './bcrypt-password-hasher';

jest.setTimeout(15000);

describe('BcryptPasswordHasher', () => {
  let hasher: BcryptPasswordHasher;

  beforeEach(() => {
    hasher = new BcryptPasswordHasher();
  });

  describe('hash()', () => {
    it('returns a string different from the plain text', async () => {
      const result = await hasher.hash('MySecret123!');
      expect(result).not.toBe('MySecret123!');
    });

    it('returns a bcrypt hash starting with the $2b$ prefix', async () => {
      const result = await hasher.hash('MySecret123!');
      expect(result).toMatch(/^\$2[ab]\$/);
    });

    it('produces different hashes for the same input (salt randomization)', async () => {
      const hash1 = await hasher.hash('SamePassword');
      const hash2 = await hasher.hash('SamePassword');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('compare()', () => {
    it('returns true when plain text matches the hash', async () => {
      const hash = await hasher.hash('CorrectPassword99');
      const result = await hasher.compare('CorrectPassword99', hash);
      expect(result).toBe(true);
    });

    it('returns false when plain text does not match the hash', async () => {
      const hash = await hasher.hash('CorrectPassword99');
      const result = await hasher.compare('WrongPassword', hash);
      expect(result).toBe(false);
    });

    it('returns false for an empty string compared to a real hash', async () => {
      const hash = await hasher.hash('SomePassword');
      const result = await hasher.compare('', hash);
      expect(result).toBe(false);
    });
  });
});
