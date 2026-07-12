import { UnauthorizedException } from '@nestjs/common';
import { RefreshTokensHandler } from './refresh-tokens.handler';
import { RefreshTokensCommand } from './refresh-tokens.command';
import { UserEntity, IPasswordHasher } from '@iranianoralhistory/backend-identity-domain';

const fakeHasher: IPasswordHasher = {
  hash: (plain) => Promise.resolve(`hashed:${plain}`),
  compare: (plain, hashed) => Promise.resolve(hashed === `hashed:${plain}`),
};

const VALID_REFRESH_TOKEN = 'valid-refresh-token-xyz';

function buildUserEntity(hasRefreshToken = true): UserEntity {
  return UserEntity.fromPersistence({
    id: 'user-uuid',
    email: 'user@test.de',
    hashedPassword: 'hashed:pw',
    hashedRefreshToken: hasRefreshToken ? `hashed:${VALID_REFRESH_TOKEN}` : null,
    role: 'USER',
  });
}

const mockUserRepo = {
  findById: jest.fn(),
  updateRefreshToken: jest.fn(),
};

const mockTokenUtils = {
  signAccessToken: jest.fn().mockReturnValue('new-access-token'),
  signRefreshToken: jest.fn().mockReturnValue('new-refresh-token'),
};

describe('RefreshTokensHandler', () => {
  let handler: RefreshTokensHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new RefreshTokensHandler(mockUserRepo as any, fakeHasher, mockTokenUtils as any);
  });

  it('returns new tokens for a valid refresh token', async () => {
    mockUserRepo.findById.mockResolvedValue(buildUserEntity());
    mockUserRepo.updateRefreshToken.mockResolvedValue(undefined);

    const result = await handler.execute(
      new RefreshTokensCommand('user-uuid', VALID_REFRESH_TOKEN),
    );

    expect(result.accessToken).toBe('new-access-token');
    expect(result.refreshToken).toBe('new-refresh-token');
  });

  it('rotates the refresh token and persists the new hash', async () => {
    mockUserRepo.findById.mockResolvedValue(buildUserEntity());
    mockUserRepo.updateRefreshToken.mockResolvedValue(undefined);

    await handler.execute(new RefreshTokensCommand('user-uuid', VALID_REFRESH_TOKEN));

    expect(mockUserRepo.updateRefreshToken).toHaveBeenCalledWith(
      'user-uuid',
      'hashed:new-refresh-token',
    );
  });

  it('throws UnauthorizedException when the user does not exist', async () => {
    mockUserRepo.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new RefreshTokensCommand('unknown-id', VALID_REFRESH_TOKEN)),
    ).rejects.toThrow(new UnauthorizedException('Access denied'));
  });

  it('throws UnauthorizedException when the user has no stored refresh token', async () => {
    mockUserRepo.findById.mockResolvedValue(buildUserEntity(false));

    await expect(
      handler.execute(new RefreshTokensCommand('user-uuid', VALID_REFRESH_TOKEN)),
    ).rejects.toThrow(new UnauthorizedException('Access denied'));
  });

  it('throws UnauthorizedException for a wrong refresh token', async () => {
    mockUserRepo.findById.mockResolvedValue(buildUserEntity());

    await expect(
      handler.execute(new RefreshTokensCommand('user-uuid', 'wrong-token')),
    ).rejects.toThrow(new UnauthorizedException('Access denied'));

    expect(mockUserRepo.updateRefreshToken).not.toHaveBeenCalled();
  });
});
