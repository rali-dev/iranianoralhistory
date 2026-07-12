import { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

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

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should extend the jwt AuthGuard strategy', () => {
    const { AuthGuard } = jest.requireMock('@nestjs/passport');
    expect(AuthGuard).toHaveBeenCalledWith('jwt');
  });

  it('should call canActivate and return true', () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: { authorization: 'Bearer token' } }),
      }),
    } as unknown as ExecutionContext;

    const result = guard.canActivate(mockContext);
    expect(result).toBe(true);
  });
});
