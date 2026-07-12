import { PrismaService } from '@iranianoralhistory/backend-shared-database';
import { PrismaPasswordResetRepository } from './prisma-password-reset.repository';

type TokenDelegate = {
  upsert: jest.Mock;
  findUnique: jest.Mock;
  deleteMany: jest.Mock;
};

describe('PrismaPasswordResetRepository', () => {
  let passwordResetToken: TokenDelegate;
  let repo: PrismaPasswordResetRepository;

  beforeEach(() => {
    passwordResetToken = {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      deleteMany: jest.fn(),
    };
    const prisma = { passwordResetToken } as unknown as PrismaService;
    repo = new PrismaPasswordResetRepository(prisma);
  });

  afterEach(() => jest.clearAllMocks());

  describe('upsert', () => {
    it('upserts by userId with create + update payloads', async () => {
      const expiresAt = new Date('2024-06-01T00:00:00.000Z');
      passwordResetToken.upsert.mockResolvedValue(undefined);

      await repo.upsert('user-uuid-1', 'token-hash', expiresAt);

      expect(passwordResetToken.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-uuid-1' },
        create: { userId: 'user-uuid-1', tokenHash: 'token-hash', expiresAt },
        update: { tokenHash: 'token-hash', expiresAt },
      });
    });
  });

  describe('findByUserId', () => {
    it('queries by userId and maps to a PasswordResetRecord', async () => {
      const expiresAt = new Date('2024-06-01T00:00:00.000Z');
      passwordResetToken.findUnique.mockResolvedValue({
        userId: 'user-uuid-1',
        tokenHash: 'token-hash',
        expiresAt,
      });

      const result = await repo.findByUserId('user-uuid-1');

      expect(passwordResetToken.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-uuid-1' },
      });
      expect(result).toEqual({ tokenHash: 'token-hash', expiresAt });
    });

    it('returns null when no row is found', async () => {
      passwordResetToken.findUnique.mockResolvedValue(null);

      const result = await repo.findByUserId('user-uuid-1');

      expect(result).toBeNull();
    });
  });

  describe('deleteByUserId', () => {
    it('deletes all tokens for the userId', async () => {
      passwordResetToken.deleteMany.mockResolvedValue({ count: 1 });

      await repo.deleteByUserId('user-uuid-1');

      expect(passwordResetToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-uuid-1' },
      });
    });
  });
});
