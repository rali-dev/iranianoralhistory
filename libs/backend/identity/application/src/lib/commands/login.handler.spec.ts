import { UnauthorizedException } from '@nestjs/common';
import { LoginHandler } from './login.handler';
import { LoginCommand } from './login.command';
import { UserEntity, IPasswordHasher } from '@iranianoralhistory/backend-identity-domain';

const fakeHasher: IPasswordHasher = {
  hash: (plain) => Promise.resolve(`hashed:${plain}`),
  compare: (plain, hashed) => Promise.resolve(hashed === `hashed:${plain}`),
};

function buildUserEntity(email = 'user@test.de', role: 'USER' | 'ADMIN' = 'USER'): UserEntity {
  return UserEntity.fromPersistence({
    id: 'user-uuid',
    email,
    hashedPassword: 'hashed:CorrectPW99',
    role,
  });
}

const mockUserRepo = {
  findByEmail: jest.fn(),
  updateRefreshToken: jest.fn(),
};

const mockTokenUtils = {
  signAccessToken: jest.fn().mockReturnValue('mock-access-token'),
  signRefreshToken: jest.fn().mockReturnValue('mock-refresh-token'),
};

function buildHandler(): LoginHandler {
  return new LoginHandler(mockUserRepo as any, fakeHasher, mockTokenUtils as any);
}

describe('LoginHandler', () => {
  let handler: LoginHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = buildHandler();
    process.env['JWT_SECRET'] = 'test-secret';
    process.env['JWT_REFRESH_SECRET'] = 'test-refresh-secret';
  });

  it('returns access and refresh tokens for valid credentials', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(buildUserEntity());
    mockUserRepo.updateRefreshToken.mockResolvedValue(undefined);

    const result = await handler.execute(
      new LoginCommand({ email: 'user@test.de', password: 'CorrectPW99' }),
    );

    expect(result.accessToken).toBe('mock-access-token');
    expect(result.refreshToken).toBe('mock-refresh-token');
  });

  it('persists the hashed refresh token in the database', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(buildUserEntity());
    mockUserRepo.updateRefreshToken.mockResolvedValue(undefined);

    await handler.execute(
      new LoginCommand({ email: 'user@test.de', password: 'CorrectPW99' }),
    );

    expect(mockUserRepo.updateRefreshToken).toHaveBeenCalledWith(
      'user-uuid',
      'hashed:mock-refresh-token',
    );
  });

  it('passes the correct JWT payload to the token service', async () => {
    const user = buildUserEntity('admin@test.de', 'ADMIN');
    mockUserRepo.findByEmail.mockResolvedValue(user);
    mockUserRepo.updateRefreshToken.mockResolvedValue(undefined);

    await handler.execute(
      new LoginCommand({ email: 'admin@test.de', password: 'CorrectPW99' }),
    );

    expect(mockTokenUtils.signAccessToken).toHaveBeenCalledWith({
      id: 'user-uuid',
      email: 'admin@test.de',
      role: 'ADMIN',
    });
  });

  it('throws UnauthorizedException for an unknown email', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);

    await expect(
      handler.execute(new LoginCommand({ email: 'unknown@test.de', password: 'pw' })),
    ).rejects.toThrow(new UnauthorizedException('Invalid credentials'));

    expect(mockTokenUtils.signAccessToken).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedException for a wrong password', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(buildUserEntity());

    await expect(
      handler.execute(new LoginCommand({ email: 'user@test.de', password: 'WrongPassword' })),
    ).rejects.toThrow(new UnauthorizedException('Invalid credentials'));

    expect(mockUserRepo.updateRefreshToken).not.toHaveBeenCalled();
  });
});
