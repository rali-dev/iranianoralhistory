import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '@iranianoralhistory/backend-shared-database';
import { createTestApp, SentResetCode } from '../support/app-helper';

jest.setTimeout(30000);

describe('Auth (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let sentResetCodes: SentResetCode[];

  // unique email per test run — prevents conflicts on re-runs
  const testEmail = `auth-test-${Date.now()}@example.com`;
  const testPassword = 'Test1234!';

  let accessCookies: string[];

  beforeAll(async () => {
    ({ app, prisma, sentResetCodes } = await createTestApp());
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await app.close();
  });

  // ─── Register ─────────────────────────────────────────────────────────────

  describe('POST /api/auth/register', () => {
    it('registers a new user successfully', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: testEmail, password: testPassword });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({ message: 'Registration successful' });
    });

    it('returns 400 for a duplicate email', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: testEmail, password: testPassword });

      expect(res.status).toBe(400);
    });

    it('returns 400 for an invalid email format', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'not-an-email', password: testPassword });

      expect(res.status).toBe(400);
    });

    it('returns 400 when required fields are missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({});

      expect(res.status).toBe(400);
    });
  });

  // ─── Login ────────────────────────────────────────────────────────────────

  describe('POST /api/auth/login', () => {
    it('signs in and sets access_token and refresh_token cookies', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testEmail, password: testPassword });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'Login successful' });

      accessCookies = res.headers['set-cookie'] as unknown as string[];
      expect(accessCookies).toBeDefined();
      expect(accessCookies.some((c) => c.startsWith('access_token='))).toBe(true);
      expect(accessCookies.some((c) => c.startsWith('refresh_token='))).toBe(true);
    });

    it('returns 401 for a wrong password', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testEmail, password: 'WrongPassword!' });

      expect(res.status).toBe(401);
    });

    it('returns 401 for an unknown email', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'unknown@example.com', password: testPassword });

      expect(res.status).toBe(401);
    });
  });

  // ─── Get Me ───────────────────────────────────────────────────────────────

  describe('GET /api/users/me', () => {
    it('returns the user profile with a valid cookie', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/users/me')
        .set('Cookie', accessCookies);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe(testEmail);
      expect(res.body.id).toBeDefined();
      expect(res.body).not.toHaveProperty('hashedPassword');
    });

    it('returns 401 without a cookie', async () => {
      const res = await request(app.getHttpServer()).get('/api/users/me');
      expect(res.status).toBe(401);
    });
  });

  // ─── Refresh ──────────────────────────────────────────────────────────────

  describe('POST /api/auth/refresh', () => {
    it('returns new tokens with a valid refresh_token cookie', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', accessCookies);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'Tokens refreshed' });

      const newCookies = res.headers['set-cookie'] as unknown as string[];
      expect(newCookies.some((c) => c.startsWith('access_token='))).toBe(true);
      // use fresh cookies for the logout step
      accessCookies = newCookies;
    });
  });

  // ─── Logout ───────────────────────────────────────────────────────────────

  describe('POST /api/auth/logout', () => {
    it('logs out successfully', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Cookie', accessCookies);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'Logout successful' });
    });

    it('returns 401 on refresh after logout (token invalidated in database)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', accessCookies);

      expect(res.status).toBe(401);
    });
  });

  // ─── Password Reset Flow ──────────────────────────────────────────────────
  // Exercises forgot-password → verify-reset-code → reset-password end-to-end.
  // The 6-digit code is normally only delivered by e-mail; the test app's
  // EMAIL_SERVICE override (see app-helper) captures it, making the flow testable.

  describe('Password reset flow', () => {
    const resetEmail = `reset-test-${Date.now()}@example.com`;
    const oldPassword = 'OldPass123!';
    const newPassword = 'NewPass456!';
    let resetCode: string;

    beforeAll(async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: resetEmail, password: oldPassword });
    });

    afterAll(async () => {
      await prisma.user.deleteMany({ where: { email: resetEmail } });
    });

    it('POST /api/auth/forgot-password returns 200 and issues a 6-digit code', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ email: resetEmail });

      expect(res.status).toBe(200);
      const entry = sentResetCodes.find((c) => c.to === resetEmail);
      expect(entry).toBeDefined();
      expect(entry?.code).toMatch(/^\d{6}$/);
      resetCode = entry?.code as string;
    });

    it('does not disclose unknown emails (still 200, no code issued)', async () => {
      const unknownEmail = `nobody-${Date.now()}@example.com`;
      const res = await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ email: unknownEmail });

      expect(res.status).toBe(200);
      expect(sentResetCodes.some((c) => c.to === unknownEmail)).toBe(false);
    });

    it('POST /api/auth/verify-reset-code rejects a wrong code with 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/verify-reset-code')
        .send({ email: resetEmail, code: '000000' });

      expect(res.status).toBe(400);
    });

    it('POST /api/auth/verify-reset-code accepts the correct code with 200', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/verify-reset-code')
        .send({ email: resetEmail, code: resetCode });

      expect(res.status).toBe(200);
    });

    it('POST /api/auth/reset-password sets the new password with 200', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({ email: resetEmail, code: resetCode, newPassword });

      expect(res.status).toBe(200);
    });

    it('the new password authenticates and the old one is rejected', async () => {
      const good = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: resetEmail, password: newPassword });
      expect(good.status).toBe(200);

      const bad = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: resetEmail, password: oldPassword });
      expect(bad.status).toBe(401);
    });

    it('the reset code is single-use — reusing it after reset returns 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({ email: resetEmail, code: resetCode, newPassword: 'Another789!' });

      expect(res.status).toBe(400);
    });
  });
});
