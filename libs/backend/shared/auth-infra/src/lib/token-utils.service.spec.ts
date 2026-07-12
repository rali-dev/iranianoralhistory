import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TokenUtilsService } from './token-utils.service';
import { IJwtPayload } from '@iranianoralhistory/shared-contracts';

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

describe('TokenUtilsService', () => {
  let service: TokenUtilsService;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(() => {
    jwtService = {
      sign: jest.fn().mockReturnValue('signed-token'),
    } as any;

    service = new TokenUtilsService(jwtService, fakeConfig);

    process.env['JWT_SECRET'] = 'test-jwt-secret';
    process.env['JWT_REFRESH_SECRET'] = 'test-refresh-secret';
  });

  afterEach(() => {
    delete process.env['JWT_SECRET'];
    delete process.env['JWT_REFRESH_SECRET'];
  });

  describe('signAccessToken()', () => {
    it('signs an access token with a 15-minute expiry', () => {
      const token = service.signAccessToken(TEST_PAYLOAD);

      expect(token).toBe('signed-token');
      expect(jwtService.sign).toHaveBeenCalledWith(TEST_PAYLOAD, {
        secret: 'test-jwt-secret',
        expiresIn: '15m',
      });
    });

    it('throws when JWT_SECRET is not set', () => {
      delete process.env['JWT_SECRET'];

      expect(() => service.signAccessToken(TEST_PAYLOAD)).toThrow(/JWT_SECRET/);
    });
  });

  describe('signRefreshToken()', () => {
    it('signs a refresh token with a 7-day expiry', () => {
      const token = service.signRefreshToken(TEST_PAYLOAD);

      expect(token).toBe('signed-token');
      expect(jwtService.sign).toHaveBeenCalledWith(TEST_PAYLOAD, {
        secret: 'test-refresh-secret',
        expiresIn: '7d',
      });
    });

    it('throws when JWT_REFRESH_SECRET is not set', () => {
      delete process.env['JWT_REFRESH_SECRET'];

      expect(() => service.signRefreshToken(TEST_PAYLOAD)).toThrow(/JWT_REFRESH_SECRET/);
    });
  });
});
