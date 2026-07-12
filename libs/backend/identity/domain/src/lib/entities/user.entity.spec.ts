import { UserEntity } from './user.entity';
import { IPasswordHasher } from '../services/password-hasher.interface';

const fakeHasher: IPasswordHasher = {
  hash: (plain) => Promise.resolve(`hashed:${plain}`),
  compare: (plain, hashed) => Promise.resolve(hashed === `hashed:${plain}`),
};

function buildUser(overrides: Partial<{
  id: string;
  email: string;
  hashedPassword: string;
  hashedRefreshToken: string | null;
  role: 'USER' | 'ADMIN';
}> = {}): UserEntity {
  return UserEntity.fromPersistence({
    id: overrides.id ?? 'user-uuid-1',
    email: overrides.email ?? 'max@example.de',
    hashedPassword: overrides.hashedPassword ?? 'hashed:secret123',
    hashedRefreshToken: overrides.hashedRefreshToken !== undefined
      ? overrides.hashedRefreshToken
      : 'hashed:refresh-token-xyz',
    role: overrides.role ?? 'USER',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  });
}

describe('UserEntity', () => {
  describe('fromPersistence()', () => {
    it('reconstructs a UserEntity from persistence data', () => {
      const user = buildUser();
      expect(user.id).toBe('user-uuid-1');
      expect(user.email.toString()).toBe('max@example.de');
      expect(user.role).toBe('USER');
    });

    it('defaults the role to USER when none is provided', () => {
      const user = UserEntity.fromPersistence({
        id: 'x',
        email: 'a@b.de',
        hashedPassword: 'hashed:pw',
      });
      expect(user.role).toBe('USER');
    });

    it('handles a null hashedRefreshToken', () => {
      const user = buildUser({ hashedRefreshToken: null });
      expect(user.hasRefreshToken()).toBe(false);
    });
  });

  describe('verifyPassword()', () => {
    it('resolves to true for a correct password', async () => {
      const user = buildUser();
      await expect(user.verifyPassword('secret123', fakeHasher)).resolves.toBe(true);
    });

    it('resolves to false for a wrong password', async () => {
      const user = buildUser();
      await expect(user.verifyPassword('wrong-password', fakeHasher)).resolves.toBe(false);
    });
  });

  describe('verifyRefreshToken()', () => {
    it('resolves to true for a valid refresh token', async () => {
      const user = buildUser();
      await expect(user.verifyRefreshToken('refresh-token-xyz', fakeHasher)).resolves.toBe(true);
    });

    it('resolves to false for a wrong refresh token', async () => {
      const user = buildUser();
      await expect(user.verifyRefreshToken('wrong-token', fakeHasher)).resolves.toBe(false);
    });

    it('resolves to false when no refresh token is stored', async () => {
      const user = buildUser({ hashedRefreshToken: null });
      await expect(user.verifyRefreshToken('any-token', fakeHasher)).resolves.toBe(false);
    });
  });

  describe('hasRefreshToken()', () => {
    it('returns true when a refresh token exists', () => {
      const user = buildUser();
      expect(user.hasRefreshToken()).toBe(true);
    });

    it('returns false when no refresh token exists', () => {
      const user = buildUser({ hashedRefreshToken: null });
      expect(user.hasRefreshToken()).toBe(false);
    });
  });

});
