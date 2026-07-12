import { PrismaService } from '@iranianoralhistory/backend-shared-database';
import { UserEntity } from '@iranianoralhistory/backend-identity-domain';
import { PrismaUserRepository } from './prisma-user.repository';

type UserDelegate = {
  findUnique: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
};

function buildUserRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'user-uuid-1',
    email: 'Test.User@Example.com',
    hashedPassword: 'hashed-password',
    hashedRefreshToken: 'hashed-refresh-token',
    role: 'USER',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-02T00:00:00.000Z'),
    ...overrides,
  };
}

describe('PrismaUserRepository', () => {
  let user: UserDelegate;
  let repo: PrismaUserRepository;

  beforeEach(() => {
    user = {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
    const prisma = { user } as unknown as PrismaService;
    repo = new PrismaUserRepository(prisma);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findById', () => {
    it('queries by id and maps the row to a UserEntity', async () => {
      const row = buildUserRow();
      user.findUnique.mockResolvedValue(row);

      const result = await repo.findById('user-uuid-1');

      expect(user.findUnique).toHaveBeenCalledWith({ where: { id: 'user-uuid-1' } });
      expect(result).toBeInstanceOf(UserEntity);
      expect(result?.id).toBe('user-uuid-1');
      expect(result?.email.toString()).toBe('test.user@example.com');
      expect(result?.role).toBe('USER');
    });

    it('returns null when no row is found', async () => {
      user.findUnique.mockResolvedValue(null);

      const result = await repo.findById('missing');

      expect(user.findUnique).toHaveBeenCalledWith({ where: { id: 'missing' } });
      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('queries by email and maps the row to a UserEntity', async () => {
      const row = buildUserRow();
      user.findUnique.mockResolvedValue(row);

      const result = await repo.findByEmail('Test.User@Example.com');

      expect(user.findUnique).toHaveBeenCalledWith({ where: { email: 'Test.User@Example.com' } });
      expect(result).toBeInstanceOf(UserEntity);
      expect(result?.email.toString()).toBe('test.user@example.com');
    });

    it('returns null when no row is found', async () => {
      user.findUnique.mockResolvedValue(null);

      const result = await repo.findByEmail('nobody@example.com');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('creates a user with email + hashedPassword and maps the row', async () => {
      const row = buildUserRow();
      user.create.mockResolvedValue(row);

      const result = await repo.create('Test.User@Example.com', 'hashed-password');

      expect(user.create).toHaveBeenCalledWith({
        data: { email: 'Test.User@Example.com', hashedPassword: 'hashed-password' },
      });
      expect(result).toBeInstanceOf(UserEntity);
      expect(result.id).toBe('user-uuid-1');
    });
  });

  describe('updateRefreshToken', () => {
    it('updates the hashedRefreshToken for the user id', async () => {
      user.update.mockResolvedValue(buildUserRow());

      await repo.updateRefreshToken('user-uuid-1', 'new-refresh-hash');

      expect(user.update).toHaveBeenCalledWith({
        where: { id: 'user-uuid-1' },
        data: { hashedRefreshToken: 'new-refresh-hash' },
      });
    });

    it('supports clearing the token with null', async () => {
      user.update.mockResolvedValue(buildUserRow());

      await repo.updateRefreshToken('user-uuid-1', null);

      expect(user.update).toHaveBeenCalledWith({
        where: { id: 'user-uuid-1' },
        data: { hashedRefreshToken: null },
      });
    });
  });

  describe('updatePassword', () => {
    it('updates the hashedPassword for the user id', async () => {
      user.update.mockResolvedValue(buildUserRow());

      await repo.updatePassword('user-uuid-1', 'new-password-hash');

      expect(user.update).toHaveBeenCalledWith({
        where: { id: 'user-uuid-1' },
        data: { hashedPassword: 'new-password-hash' },
      });
    });
  });
});
