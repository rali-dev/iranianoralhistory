import { BadRequestException } from '@nestjs/common';
import { VerifyResetCodeHandler } from './verify-reset-code.handler';
import { VerifyResetCodeCommand } from './verify-reset-code.command';

const mockUser = { id: 'user-uuid', email: 'test@example.com' };
const futureDate = new Date(Date.now() + 10 * 60 * 1000);
const pastDate = new Date(Date.now() - 1000);

const mockUserRepo = { findByEmail: jest.fn(), findById: jest.fn(), create: jest.fn(), updatePassword: jest.fn(), updateRefreshToken: jest.fn() };
const mockResetRepo = { findByUserId: jest.fn(), upsert: jest.fn(), deleteByUserId: jest.fn() };
const mockPasswordHasher = { hash: jest.fn(), compare: jest.fn() };

describe('VerifyResetCodeHandler', () => {
  let handler: VerifyResetCodeHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new VerifyResetCodeHandler(
      mockUserRepo as any,
      mockResetRepo as any,
      mockPasswordHasher as any,
    );
  });

  it('resolves without error when email, record, and code are all valid', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(mockUser);
    mockResetRepo.findByUserId.mockResolvedValue({ tokenHash: 'hash', expiresAt: futureDate });
    mockPasswordHasher.compare.mockResolvedValue(true);

    await expect(
      handler.execute(new VerifyResetCodeCommand({ email: 'test@example.com', code: '123456' })),
    ).resolves.toBeUndefined();
  });

  it('throws BadRequestException when user is not found', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);

    await expect(
      handler.execute(new VerifyResetCodeCommand({ email: 'no@example.com', code: '123456' })),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException when no reset record exists', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(mockUser);
    mockResetRepo.findByUserId.mockResolvedValue(null);

    await expect(
      handler.execute(new VerifyResetCodeCommand({ email: 'test@example.com', code: '123456' })),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException when the reset record has expired', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(mockUser);
    mockResetRepo.findByUserId.mockResolvedValue({ tokenHash: 'hash', expiresAt: pastDate });

    await expect(
      handler.execute(new VerifyResetCodeCommand({ email: 'test@example.com', code: '123456' })),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException when code does not match the stored hash', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(mockUser);
    mockResetRepo.findByUserId.mockResolvedValue({ tokenHash: 'hash', expiresAt: futureDate });
    mockPasswordHasher.compare.mockResolvedValue(false);

    await expect(
      handler.execute(new VerifyResetCodeCommand({ email: 'test@example.com', code: '000000' })),
    ).rejects.toThrow(BadRequestException);
  });
});
