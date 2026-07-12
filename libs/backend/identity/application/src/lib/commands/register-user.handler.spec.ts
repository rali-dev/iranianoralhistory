import { BadRequestException } from '@nestjs/common';
import { RegisterUserHandler } from './register-user.handler';
import { RegisterUserCommand } from './register-user.command';
import { IPasswordHasher, UserRegisteredEvent } from '@iranianoralhistory/backend-identity-domain';
import { DOMAIN_EVENT_PUBLISHER } from '@iranianoralhistory/shared-contracts';

const fakeHasher: IPasswordHasher = {
  hash: (plain) => Promise.resolve(`hashed:${plain}`),
  compare: (plain, hashed) => Promise.resolve(hashed === `hashed:${plain}`),
};

const mockUserRepo = {
  findByEmail: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  updateRefreshToken: jest.fn(),
  updatePassword: jest.fn(),
};

const mockEventPublisher = {
  publish: jest.fn(),
};

function buildHandler(): RegisterUserHandler {
  return new RegisterUserHandler(mockUserRepo as any, fakeHasher, mockEventPublisher as any);
}

describe('RegisterUserHandler', () => {
  let handler: RegisterUserHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = buildHandler();
  });

  it('registers a new user and returns a success message', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);
    mockUserRepo.create.mockResolvedValue({ id: 'new-uuid', email: 'new@example.de' });

    const result = await handler.execute(
      new RegisterUserCommand({ email: 'new@example.de', password: 'Password123' }),
    );

    expect(result).toEqual({ message: 'Registration successful' });
    expect(mockUserRepo.findByEmail).toHaveBeenCalledWith('new@example.de');
    expect(mockUserRepo.create).toHaveBeenCalledWith(
      'new@example.de',
      expect.any(String),
    );
  });

  it('publishes a UserRegisteredEvent after successful registration', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);
    mockUserRepo.create.mockResolvedValue({ id: 'abc-123', email: 'new@example.de' });

    await handler.execute(
      new RegisterUserCommand({ email: 'new@example.de', password: 'Password123' }),
    );

    expect(mockEventPublisher.publish).toHaveBeenCalledWith(
      expect.any(UserRegisteredEvent),
    );
    const publishedEvent = mockEventPublisher.publish.mock.calls[0][0] as UserRegisteredEvent;
    expect(publishedEvent.userId).toBe('abc-123');
    expect(publishedEvent.email).toBe('new@example.de');
  });

  it('throws BadRequestException when the email is already in use', async () => {
    mockUserRepo.findByEmail.mockResolvedValue({ id: 'existing-uuid' });

    await expect(
      handler.execute(
        new RegisterUserCommand({ email: 'taken@example.de', password: 'Test123' }),
      ),
    ).rejects.toThrow(new BadRequestException('Email already in use'));

    expect(mockUserRepo.create).not.toHaveBeenCalled();
    expect(mockEventPublisher.publish).not.toHaveBeenCalled();
  });

  it('throws when the email format is invalid', async () => {
    await expect(
      handler.execute(
        new RegisterUserCommand({ email: 'not-an-email', password: 'Test123' }),
      ),
    ).rejects.toThrow();
    expect(mockUserRepo.findByEmail).not.toHaveBeenCalled();
  });

  it('hashes the password before persisting it (plaintext is never stored)', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);
    mockUserRepo.create.mockResolvedValue({ id: 'x', email: 'a@b.de' });
    const plainPassword = 'MyPassword99';

    await handler.execute(
      new RegisterUserCommand({ email: 'a@b.de', password: plainPassword }),
    );

    const savedHash = mockUserRepo.create.mock.calls[0][1] as string;
    expect(savedHash).not.toBe(plainPassword);
    expect(savedHash).toBe(`hashed:${plainPassword}`);
  });
});
