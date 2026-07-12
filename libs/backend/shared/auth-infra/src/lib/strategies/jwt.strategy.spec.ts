import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { IJwtPayload } from '@iranianoralhistory/shared-contracts';
import { JwtStrategy } from './jwt.strategy';

const fakeConfig = {
  get: (k: string) => process.env[k],
  getOrThrow: (k: string) => {
    const v = process.env[k];
    if (v === undefined) throw new Error(`Missing ${k}`);
    return v;
  },
} as unknown as ConfigService;

const TEST_PAYLOAD: IJwtPayload = {
  id: 'user-uuid',
  email: 'test@example.de',
  role: 'USER',
};

describe('JwtStrategy', () => {
  const ORIGINAL_SECRET = process.env['JWT_SECRET'];

  beforeEach(() => {
    process.env['JWT_SECRET'] = 'test-jwt-secret';
  });

  afterEach(() => {
    if (ORIGINAL_SECRET === undefined) {
      delete process.env['JWT_SECRET'];
    } else {
      process.env['JWT_SECRET'] = ORIGINAL_SECRET;
    }
  });

  describe('constructor', () => {
    it('is defined when JWT_SECRET is set', () => {
      expect(new JwtStrategy(fakeConfig)).toBeDefined();
    });

    it('throws when JWT_SECRET is not set', () => {
      delete process.env['JWT_SECRET'];

      expect(() => new JwtStrategy(fakeConfig)).toThrow(/JWT_SECRET/);
    });
  });

  describe('validate()', () => {
    it('returns the JWT payload unchanged', async () => {
      const strategy = new JwtStrategy(fakeConfig);

      await expect(strategy.validate(TEST_PAYLOAD)).resolves.toEqual(TEST_PAYLOAD);
    });
  });

  describe('cookie extraction', () => {
    const extractFromCookie = (JwtStrategy as unknown as {
      extractFromCookie: (req: Request) => string | null;
    }).extractFromCookie;

    it('extracts the access_token from the request cookies', () => {
      const req = { cookies: { access_token: 'cookie-token' } } as unknown as Request;

      expect(extractFromCookie(req)).toBe('cookie-token');
    });

    it('returns null when the access_token cookie is absent', () => {
      const req = { cookies: {} } as unknown as Request;

      expect(extractFromCookie(req)).toBeNull();
    });

    it('returns null when the request carries no cookies', () => {
      expect(extractFromCookie({} as Request)).toBeNull();
    });
  });
});
