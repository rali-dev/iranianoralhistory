import { AuthController } from './auth.controller';
import { AuthTokens } from '@iranianoralhistory/backend-identity-application';

function buildTokens(): AuthTokens {
  return { accessToken: 'acc-token', refreshToken: 'ref-token' };
}

function buildMockResponse() {
  return {
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
  };
}

const mockCommandBus = { execute: jest.fn() };

function buildController(): AuthController {
  return new AuthController(mockCommandBus as any);
}

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = buildController();
    delete process.env['NODE_ENV'];
  });

  describe('register()', () => {
    it('dispatches RegisterUserCommand with the provided dto', () => {
      mockCommandBus.execute.mockResolvedValue(undefined);
      const dto = { email: 'user@test.de', password: 'Pw123456!' };

      controller.register(dto as any);

      expect(mockCommandBus.execute).toHaveBeenCalledTimes(1);
      const [command] = mockCommandBus.execute.mock.calls[0];
      expect(command.constructor.name).toBe('RegisterUserCommand');
    });
  });

  describe('login()', () => {
    it('dispatches LoginCommand and sets access + refresh cookies', async () => {
      mockCommandBus.execute.mockResolvedValue(buildTokens());
      const res = buildMockResponse();

      await controller.login({ email: 'u@t.de', password: 'pw' } as any, res as any);

      expect(mockCommandBus.execute).toHaveBeenCalledTimes(1);
      expect(res.cookie).toHaveBeenCalledWith('access_token', 'acc-token', expect.objectContaining({ httpOnly: true }));
      expect(res.cookie).toHaveBeenCalledWith('refresh_token', 'ref-token', expect.objectContaining({ httpOnly: true }));
      expect(res.json).toHaveBeenCalledWith({ message: 'Login successful' });
    });

    it('sets secure:false cookies outside production', async () => {
      mockCommandBus.execute.mockResolvedValue(buildTokens());
      const res = buildMockResponse();

      await controller.login({ email: 'u@t.de', password: 'pw' } as any, res as any);

      expect(res.cookie).toHaveBeenCalledWith(
        'access_token',
        expect.any(String),
        expect.objectContaining({ secure: false }),
      );
    });

    it('sets secure:true cookies in production', async () => {
      process.env['NODE_ENV'] = 'production';
      mockCommandBus.execute.mockResolvedValue(buildTokens());
      const res = buildMockResponse();

      await controller.login({ email: 'u@t.de', password: 'pw' } as any, res as any);

      expect(res.cookie).toHaveBeenCalledWith(
        'access_token',
        expect.any(String),
        expect.objectContaining({ secure: true }),
      );
    });
  });

  describe('logout()', () => {
    it('dispatches LogoutCommand with the user id from JWT payload', async () => {
      mockCommandBus.execute.mockResolvedValue(undefined);
      const req = { user: { id: 'user-uuid', email: 'u@t.de', role: 'USER' } };
      const res = buildMockResponse();

      await controller.logout(req as any, res as any);

      const [command] = mockCommandBus.execute.mock.calls[0];
      expect(command.constructor.name).toBe('LogoutCommand');
      expect(command.userId).toBe('user-uuid');
    });

    it('clears both auth cookies', async () => {
      mockCommandBus.execute.mockResolvedValue(undefined);
      const req = { user: { id: 'user-uuid', email: 'u@t.de', role: 'USER' } };
      const res = buildMockResponse();

      await controller.logout(req as any, res as any);

      expect(res.clearCookie).toHaveBeenCalledWith('access_token');
      expect(res.clearCookie).toHaveBeenCalledWith('refresh_token');
      expect(res.json).toHaveBeenCalledWith({ message: 'Logout successful' });
    });
  });

  describe('refresh()', () => {
    it('dispatches RefreshTokensCommand with user id and refreshToken', async () => {
      mockCommandBus.execute.mockResolvedValue(buildTokens());
      const req = { user: { id: 'user-uuid', refreshToken: 'old-refresh' } };
      const res = buildMockResponse();

      await controller.refresh(req as any, res as any);

      const [command] = mockCommandBus.execute.mock.calls[0];
      expect(command.constructor.name).toBe('RefreshTokensCommand');
      expect(command.userId).toBe('user-uuid');
      expect(command.incomingToken).toBe('old-refresh');
    });

    it('sets new cookies after refresh', async () => {
      mockCommandBus.execute.mockResolvedValue(buildTokens());
      const req = { user: { id: 'user-uuid', refreshToken: 'old-refresh' } };
      const res = buildMockResponse();

      await controller.refresh(req as any, res as any);

      expect(res.cookie).toHaveBeenCalledWith('access_token', 'acc-token', expect.any(Object));
      expect(res.cookie).toHaveBeenCalledWith('refresh_token', 'ref-token', expect.any(Object));
      expect(res.json).toHaveBeenCalledWith({ message: 'Tokens refreshed' });
    });
  });

  describe('forgotPassword()', () => {
    it('dispatches RequestPasswordResetCommand and returns a safe message', async () => {
      mockCommandBus.execute.mockResolvedValue(undefined);

      const result = await controller.forgotPassword({ email: 'u@t.de' } as any);

      const [command] = mockCommandBus.execute.mock.calls[0];
      expect(command.constructor.name).toBe('RequestPasswordResetCommand');
      expect(result.message).toContain('Falls ein Konto');
    });
  });

  describe('verifyResetCode()', () => {
    it('dispatches VerifyResetCodeCommand and returns confirmation message', async () => {
      mockCommandBus.execute.mockResolvedValue(undefined);

      const result = await controller.verifyResetCode({ email: 'u@t.de', code: '123456' } as any);

      const [command] = mockCommandBus.execute.mock.calls[0];
      expect(command.constructor.name).toBe('VerifyResetCodeCommand');
      expect(result.message).toBe('Code bestätigt.');
    });
  });

  describe('resetPassword()', () => {
    it('dispatches ResetPasswordCommand and returns success message', async () => {
      mockCommandBus.execute.mockResolvedValue(undefined);

      const result = await controller.resetPassword({ email: 'u@t.de', code: '123456', newPassword: 'Pw!' } as any);

      const [command] = mockCommandBus.execute.mock.calls[0];
      expect(command.constructor.name).toBe('ResetPasswordCommand');
      expect(result.message).toContain('Passwort erfolgreich');
    });
  });

  describe('setCookies() — maxAge values', () => {
    it('sets access_token maxAge to 15 minutes', async () => {
      mockCommandBus.execute.mockResolvedValue(buildTokens());
      const res = buildMockResponse();

      await controller.login({ email: 'u@t.de', password: 'pw' } as any, res as any);

      const accessCookieCall = res.cookie.mock.calls.find((c: string[]) => c[0] === 'access_token');
      expect(accessCookieCall?.[2].maxAge).toBe(15 * 60 * 1000);
    });

    it('sets refresh_token maxAge to 7 days', async () => {
      mockCommandBus.execute.mockResolvedValue(buildTokens());
      const res = buildMockResponse();

      await controller.login({ email: 'u@t.de', password: 'pw' } as any, res as any);

      const refreshCookieCall = res.cookie.mock.calls.find((c: string[]) => c[0] === 'refresh_token');
      expect(refreshCookieCall?.[2].maxAge).toBe(7 * 24 * 60 * 60 * 1000);
    });
  });
});
