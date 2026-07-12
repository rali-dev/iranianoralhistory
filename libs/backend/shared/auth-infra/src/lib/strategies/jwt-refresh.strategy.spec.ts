import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { IRefreshJwtPayload } from '@iranianoralhistory/shared-contracts';
import { JwtRefreshStrategy } from './jwt-refresh.strategy';

const fakeConfig = {
  get: (k: string) => process.env[k],
  getOrThrow: (k: string) => {
    const v = process.env[k];
    if (v === undefined) throw new Error(`Missing ${k}`);
    return v;
  },
} as unknown as ConfigService;

const TEST_PAYLOAD: IRefreshJwtPayload = {
  id: 'user-uuid',
  email: 'test@example.de',
  role: 'USER',
};

describe('JwtRefreshStrategy', () => {
  const ORIGINAL_SECRET = process.env['JWT_REFRESH_SECRET'];

  beforeEach(() => {
    process.env['JWT_REFRESH_SECRET'] = 'test-refresh-secret';
  });

  afterEach(() => {
    if (ORIGINAL_SECRET === undefined) {
      delete process.env['JWT_REFRESH_SECRET'];
    } else {
      process.env['JWT_REFRESH_SECRET'] = ORIGINAL_SECRET;
    }
  });

  describe('constructor', () => {
    it('is defined when JWT_REFRESH_SECRET is set', () => {
      expect(new JwtRefreshStrategy(fakeConfig)).toBeDefined();
    });

    it('throws when JWT_REFRESH_SECRET is not set', () => {
      delete process.env['JWT_REFRESH_SECRET'];

      expect(() => new JwtRefreshStrategy(fakeConfig)).toThrow(/JWT_REFRESH_SECRET/);
    });
  });

  describe('validate()', () => {
    it('returns the payload with the refresh token taken from the cookie', async () => {
      const strategy = new JwtRefreshStrategy(fakeConfig);
      const req = {
        cookies: { refresh_token: 'refresh-cookie-token' },
      } as unknown as Request;

      await expect(strategy.validate(req, TEST_PAYLOAD)).resolves.toEqual({
        ...TEST_PAYLOAD,
        refreshToken: 'refresh-cookie-token',
      });
    });

    it('returns an undefined refresh token when the cookie is absent', async () => {
      const strategy = new JwtRefreshStrategy(fakeConfig);
      const req = { cookies: {} } as unknown as Request;

      await expect(strategy.validate(req, TEST_PAYLOAD)).resolves.toEqual({
        ...TEST_PAYLOAD,
        refreshToken: undefined,
      });
    });
  });

  describe('cookie extraction', () => {
    const extractFromCookie = (JwtRefreshStrategy as unknown as {
      extractFromCookie: (req: Request) => string | null;
    }).extractFromCookie;

    it('extracts the refresh_token from the request cookies', () => {
      const req = {
        cookies: { refresh_token: 'refresh-cookie-token' },
      } as unknown as Request;

      expect(extractFromCookie(req)).toBe('refresh-cookie-token');
    });

    it('returns null when the refresh_token cookie is absent', () => {
      const req = { cookies: {} } as unknown as Request;

      expect(extractFromCookie(req)).toBeNull();
    });

    it('returns null when the request carries no cookies', () => {
      expect(extractFromCookie({} as Request)).toBeNull();
    });
  });
});
