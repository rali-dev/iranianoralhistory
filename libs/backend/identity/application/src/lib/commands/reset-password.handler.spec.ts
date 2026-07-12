import { BadRequestException } from '@nestjs/common';
import { ResetPasswordHandler } from './reset-password.handler';
import { ResetPasswordCommand } from './reset-password.command';

const mockUser = { id: 'user-uuid', email: 'test@example.com' };
const futureDate = new Date(Date.now() + 10 * 60 * 1000);
const pastDate = new Date(Date.now() - 1000);

const mockUserRepo = { findByEmail: jest.fn(), findById: jest.fn(), save: jest.fn(), updatePassword: jest.fn(), updateRefreshToken: jest.fn() };
const mockResetRepo = { findByUserId: jest.fn(), upsert: jest.fn(), deleteByUserId: jest.fn() };
const mockPasswordHasher = { hash: jest.fn(), compare: jest.fn() };

describe('ResetPasswordHandler', () => {
  let handler: ResetPasswordHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new ResetPasswordHandler(
      mockUserRepo as any,
      mockResetRepo as any,
      mockPasswordHasher as any,
    );
  });

  it('updates the password and deletes the reset record on success', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(mockUser);
    mockResetRepo.findByUserId.mockResolvedValue({ tokenHash: 'hash', expiresAt: futureDate });
    mockPasswordHasher.compare.mockResolvedValue(true);
    mockPasswordHasher.hash.mockResolvedValue('new-hashed-password');

    await handler.execute(
      new ResetPasswordCommand({ email: 'test@example.com', code: '123456', newPassword: 'NewPass1!' }),
    );

    expect(mockPasswordHasher.hash).toHaveBeenCalledWith('NewPass1!');
    expect(mockUserRepo.updatePassword).toHaveBeenCalledWith('user-uuid', 'new-hashed-password');
    expect(mockResetRepo.deleteByUserId).toHaveBeenCalledWith('user-uuid');
  });

  it('throws BadRequestException when the user is not found', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);

    await expect(
      handler.execute(new ResetPasswordCommand({ email: 'no@example.com', code: '123456', newPassword: 'Pass!' })),
    ).rejects.toThrow(BadRequestException);

    expect(mockUserRepo.updatePassword).not.toHaveBeenCalled();
  });

  it('throws BadRequestException when the reset record has expired', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(mockUser);
    mockResetRepo.findByUserId.mockResolvedValue({ tokenHash: 'hash', expiresAt: pastDate });

    await expect(
      handler.execute(new ResetPasswordCommand({ email: 'test@example.com', code: '123456', newPassword: 'Pass!' })),
    ).rejects.toThrow(BadRequestException);

    expect(mockUserRepo.updatePassword).not.toHaveBeenCalled();
  });

  it('throws BadRequestException when the code does not match', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(mockUser);
    mockResetRepo.findByUserId.mockResolvedValue({ tokenHash: 'hash', expiresAt: futureDate });
    mockPasswordHasher.compare.mockResolvedValue(false);

    await expect(
      handler.execute(new ResetPasswordCommand({ email: 'test@example.com', code: '000000', newPassword: 'Pass!' })),
    ).rejects.toThrow(BadRequestException);

    expect(mockUserRepo.updatePassword).not.toHaveBeenCalled();
    expect(mockResetRepo.deleteByUserId).not.toHaveBeenCalled();
  });
});
