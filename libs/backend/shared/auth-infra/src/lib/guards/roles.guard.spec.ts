import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';

function buildContext(userRole: string | undefined, requiredRoles: string[] | undefined) {
  return {
    getHandler: jest.fn().mockReturnValue(() => { /* no-op */ }),
    getClass: jest.fn().mockReturnValue(class {}),
    switchToHttp: () => ({
      getRequest: () => ({
        user: userRole !== undefined ? { role: userRole } : {},
      }),
    }),
  } as any;
}

describe('RolesGuard', () => {
  let reflector: jest.Mocked<Reflector>;
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as any;
    guard = new RolesGuard(reflector);
  });

  it('returns true when no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const ctx = buildContext('USER', undefined);

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('returns true when the required roles list is empty', () => {
    reflector.getAllAndOverride.mockReturnValue([]);
    const ctx = buildContext('USER', []);

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('returns true when the user holds the required ADMIN role', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    const ctx = buildContext('ADMIN', ['ADMIN']);

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('returns true when the user holds one of several allowed roles', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN', 'USER']);
    const ctx = buildContext('USER', ['ADMIN', 'USER']);

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('throws ForbiddenException when the user has an insufficient role', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    const ctx = buildContext('USER', ['ADMIN']);

    expect(() => guard.canActivate(ctx)).toThrow(
      new ForbiddenException('Insufficient permissions'),
    );
  });

  it('throws ForbiddenException when no user object is present on the request', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    const ctx = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user: undefined }),
      }),
    } as any;

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('reads metadata from both handler and class', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const ctx = buildContext('USER', undefined);
    guard.canActivate(ctx);

    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
      expect.anything(),
      expect.anything(),
    ]);
  });
});
