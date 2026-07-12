import { UnauthorizedException } from '@nestjs/common';
import { GetMeHandler } from './get-me.handler';
import { GetMeQuery } from './get-me.query';
import { UserEntity } from '@iranianoralhistory/backend-identity-domain';

function buildUserEntity(role: 'USER' | 'ADMIN' = 'USER'): UserEntity {
  return UserEntity.fromPersistence({
    id: 'user-uuid',
    email: 'me@example.de',
    hashedPassword: 'hashed:pw',
    role,
    createdAt: new Date('2024-06-01'),
    updatedAt: new Date('2024-06-01'),
  });
}

const mockUserRepo = {
  findById: jest.fn(),
};

describe('GetMeHandler', () => {
  let handler: GetMeHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new GetMeHandler(mockUserRepo as any);
  });

  it('returns user data without sensitive fields', async () => {
    mockUserRepo.findById.mockResolvedValue(buildUserEntity());

    const result = await handler.execute(new GetMeQuery('user-uuid'));

    expect(result.id).toBe('user-uuid');
    expect(result.email).toBe('me@example.de');
    expect(result.role).toBe('USER');
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result).not.toHaveProperty('hashedPassword');
  });

  it('returns the ADMIN role correctly', async () => {
    mockUserRepo.findById.mockResolvedValue(buildUserEntity('ADMIN'));

    const result = await handler.execute(new GetMeQuery('user-uuid'));
    expect(result.role).toBe('ADMIN');
  });

  it('throws UnauthorizedException when the user is not found', async () => {
    mockUserRepo.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new GetMeQuery('unknown-id')),
    ).rejects.toThrow(new UnauthorizedException('User not found'));
  });
});
