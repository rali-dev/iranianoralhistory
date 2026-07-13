import { BadRequestException } from '@nestjs/common';
import { ResetPasswordHandler } from './reset-password.handler';
import { ResetPasswordCommand } from './reset-password.command';

const mockUser = { id: 'user-uuid', email: 'test@example.com' };
const futureDate = new Date(Date.now() + 10 * 60 * 1000);
const pastDate = new Date(Date.now() - 1000);

const mockUserRepo = { findByEmail: jest.fn(), findById: jest.fn(), create: jest.fn(), updatePassword: jest.fn(), updateRefreshToken: jest.fn() };
const mockResetRepo = { findByUserId: jest.fn(), upsert: jest.fn(), deleteByUserId: jest.fn() };
const mockResetTx = { commitReset: jest.fn() };
const mockPasswordHasher = { hash: jest.fn(), compare: jest.fn() };

describe('ResetPasswordHandler', () => {
  let handler: ResetPasswordHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new ResetPasswordHandler(
      mockUserRepo as any,
      mockResetRepo as any,
      mockResetTx as any,
      mockPasswordHasher as any,
    );
  });

  it('commits the reset atomically (delete token + set password in one transaction)', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(mockUser);
    mockResetRepo.findByUserId.mockResolvedValue({ tokenHash: 'hash', expiresAt: futureDate });
    mockPasswordHasher.compare.mockResolvedValue(true);
    mockPasswordHasher.hash.mockResolvedValue('new-hashed-password');

    await handler.execute(
      new ResetPasswordCommand({ email: 'test@example.com', code: '123456', newPassword: 'NewPass1!' }),
    );

    expect(mockPasswordHasher.hash).toHaveBeenCalledWith('NewPass1!');
    // Beide Writes gehen durch die atomare Transaktion — NICHT mehr durch die
    // einzelnen Repo-Methoden.
    expect(mockResetTx.commitReset).toHaveBeenCalledWith('user-uuid', 'new-hashed-password');
    expect(mockResetTx.commitReset).toHaveBeenCalledTimes(1);
    expect(mockResetRepo.deleteByUserId).not.toHaveBeenCalled();
    expect(mockUserRepo.updatePassword).not.toHaveBeenCalled();
  });

  it('throws BadRequestException when the user is not found', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);

    await expect(
      handler.execute(new ResetPasswordCommand({ email: 'no@example.com', code: '123456', newPassword: 'Pass!' })),
    ).rejects.toThrow(BadRequestException);

    expect(mockResetTx.commitReset).not.toHaveBeenCalled();
  });

  it('throws BadRequestException when no reset record exists (null record)', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(mockUser);
    mockResetRepo.findByUserId.mockResolvedValue(null);

    await expect(
      handler.execute(new ResetPasswordCommand({ email: 'test@example.com', code: '123456', newPassword: 'NewPass1!' })),
    ).rejects.toThrow(BadRequestException);

    expect(mockPasswordHasher.compare).not.toHaveBeenCalled();
    expect(mockResetTx.commitReset).not.toHaveBeenCalled();
  });

  it('does not touch persistence before the code is verified', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(mockUser);
    mockResetRepo.findByUserId.mockResolvedValue({ tokenHash: 'hash', expiresAt: futureDate });
    mockPasswordHasher.compare.mockResolvedValue(true);
    mockPasswordHasher.hash.mockResolvedValue('new-hashed-password');

    await handler.execute(
      new ResetPasswordCommand({ email: 'test@example.com', code: '123456', newPassword: 'NewPass1!' }),
    );

    // Die Verifikation (compare) läuft VOR dem atomaren Write.
    const compareOrder = mockPasswordHasher.compare.mock.invocationCallOrder[0];
    const commitOrder = mockResetTx.commitReset.mock.invocationCallOrder[0];
    expect(compareOrder).toBeLessThan(commitOrder);
  });

  it('throws BadRequestException when the reset record has expired', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(mockUser);
    mockResetRepo.findByUserId.mockResolvedValue({ tokenHash: 'hash', expiresAt: pastDate });

    await expect(
      handler.execute(new ResetPasswordCommand({ email: 'test@example.com', code: '123456', newPassword: 'Pass!' })),
    ).rejects.toThrow(BadRequestException);

    expect(mockResetTx.commitReset).not.toHaveBeenCalled();
  });

  it('throws BadRequestException when the code does not match', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(mockUser);
    mockResetRepo.findByUserId.mockResolvedValue({ tokenHash: 'hash', expiresAt: futureDate });
    mockPasswordHasher.compare.mockResolvedValue(false);

    await expect(
      handler.execute(new ResetPasswordCommand({ email: 'test@example.com', code: '000000', newPassword: 'Pass!' })),
    ).rejects.toThrow(BadRequestException);

    expect(mockResetTx.commitReset).not.toHaveBeenCalled();
  });
});
