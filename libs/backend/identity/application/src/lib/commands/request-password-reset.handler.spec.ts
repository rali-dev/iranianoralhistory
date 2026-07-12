import { RequestPasswordResetHandler } from './request-password-reset.handler';
import { RequestPasswordResetCommand } from './request-password-reset.command';
import { UserEntity } from '@iranianoralhistory/backend-identity-domain';

const mockUser: Partial<UserEntity> = { id: 'user-uuid', email: 'test@example.com' as any };

const mockUserRepo = { findByEmail: jest.fn(), findById: jest.fn(), create: jest.fn(), updatePassword: jest.fn(), updateRefreshToken: jest.fn() };
const mockResetRepo = { findByUserId: jest.fn(), upsert: jest.fn(), deleteByUserId: jest.fn() };
const mockEmailService = { sendPasswordResetCode: jest.fn() };
const mockPasswordHasher = { hash: jest.fn(), compare: jest.fn() };

describe('RequestPasswordResetHandler', () => {
  let handler: RequestPasswordResetHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new RequestPasswordResetHandler(
      mockUserRepo as any,
      mockResetRepo as any,
      mockEmailService as any,
      mockPasswordHasher as any,
    );
  });

  it('upserts a reset token and sends an email when the user exists', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(mockUser);
    mockPasswordHasher.hash.mockResolvedValue('hashed-code');

    await handler.execute(
      new RequestPasswordResetCommand({ email: 'test@example.com' }),
    );

    expect(mockResetRepo.upsert).toHaveBeenCalledWith(
      'user-uuid',
      'hashed-code',
      expect.any(Date),
    );
    expect(mockEmailService.sendPasswordResetCode).toHaveBeenCalledWith(
      'test@example.com',
      expect.any(String),
    );
  });

  it('returns without error when the email does not exist (security: no disclosure)', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);

    await expect(
      handler.execute(new RequestPasswordResetCommand({ email: 'unknown@example.com' })),
    ).resolves.toBeUndefined();

    expect(mockResetRepo.upsert).not.toHaveBeenCalled();
    expect(mockEmailService.sendPasswordResetCode).not.toHaveBeenCalled();
  });

  it('sets expiry roughly 10 minutes in the future', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(mockUser);
    mockPasswordHasher.hash.mockResolvedValue('hashed-code');

    const before = Date.now();
    await handler.execute(new RequestPasswordResetCommand({ email: 'test@example.com' }));
    const after = Date.now();

    const expiresAt: Date = mockResetRepo.upsert.mock.calls[0][2];
    expect(expiresAt.getTime()).toBeGreaterThanOrEqual(before + 9 * 60 * 1000);
    expect(expiresAt.getTime()).toBeLessThanOrEqual(after + 11 * 60 * 1000);
  });
});
