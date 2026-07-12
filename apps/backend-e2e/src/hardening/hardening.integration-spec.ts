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
});
