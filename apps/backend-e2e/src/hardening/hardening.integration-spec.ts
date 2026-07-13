import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../support/app-helper';

jest.setTimeout(30000);

/**
 * Verifiziert die Transport-Härtung aus main.ts (helmet + CORS), die zuvor von
 * keinem Test ausgeführt wurde.
 */
describe('HTTP hardening (Integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await createTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  it('sets helmet security headers and hides x-powered-by', async () => {
    const res = await request(app.getHttpServer()).get('/api/videos');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('reflects the configured CORS origin with credentials', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/videos')
      .set('Origin', 'http://localhost:4200');

    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:4200');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('exposes a public health endpoint that pings the database', async () => {
    const res = await request(app.getHttpServer()).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.db).toBe('up');
    expect(typeof res.body.timestamp).toBe('string');
  });

  it('rate-limits the password-reset entrypoint (per-route throttle)', async () => {
    const server = app.getHttpServer();
    const statuses: number[] = [];
    // Route-Limit ist 10/min. Der 11. Versuch muss gedrosselt werden (429).
    for (let i = 0; i < 11; i++) {
      const res = await request(server)
        .post('/api/auth/forgot-password')
        .send({ email: 'throttle-probe@example.com' });
      statuses.push(res.status);
    }

    expect(statuses.filter((s) => s === 429).length).toBeGreaterThan(0);
    expect(statuses[0]).toBe(200);
  });
});
