import { ExecutionContext } from '@nestjs/common';
import { JwtRefreshGuard } from './jwt-refresh.guard';

jest.mock('@nestjs/passport', () => ({
  AuthGuard: jest.fn((strategy: string) => {
    class MockAuthGuard {
      canActivate(_ctx: ExecutionContext) {
        return true;
      }
      getPassportStrategy() {
        return strategy;
      }
    }
    return MockAuthGuard;
  }),
}));

describe('JwtRefreshGuard', () => {
  let guard: JwtRefreshGuard;

  beforeEach(() => {
    guard = new JwtRefreshGuard();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should extend the jwt-refresh AuthGuard strategy', () => {
    const { AuthGuard } = jest.requireMock('@nestjs/passport');
    expect(AuthGuard).toHaveBeenCalledWith('jwt-refresh');
  });

  it('should call canActivate and return true', () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: { cookie: 'refresh_token=abc' } }),
      }),
    } as unknown as ExecutionContext;

    const result = guard.canActivate(mockContext);
    expect(result).toBe(true);
  });
});
