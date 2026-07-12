import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '@iranianoralhistory/backend-shared-database';
import { createTestApp } from '../support/app-helper';

jest.setTimeout(30000);

describe('Videos (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // setup: one video and one admin user for auth-protected endpoint tests
  const testEmail = `video-test-${Date.now()}@example.com`;
  const testPassword = 'Test1234!';
  let authCookies: string[];
  let createdVideoId: string;
  let secondVideoId: string;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());

    // register the test user, promote to ADMIN, then log in
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: testEmail, password: testPassword });

    await prisma.user.update({
      where: { email: testEmail },
      data: { role: 'ADMIN' },
    });

    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: testEmail, password: testPassword });

    authCookies = loginRes.headers['set-cookie'] as unknown as string[];
  });

  afterAll(async () => {
    if (createdVideoId) {
      await prisma.video.delete({ where: { id: createdVideoId } }).catch(() => null);
    }
    if (secondVideoId) {
      await prisma.video.delete({ where: { id: secondVideoId } }).catch(() => null);
    }
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await app.close();
  });

  // ─── GET /api/videos ──────────────────────────────────────────────────────

  describe('GET /api/videos', () => {
    it('returns a list (public endpoint)', async () => {
      const res = await request(app.getHttpServer()).get('/api/videos');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('each video object contains the expected fields', async () => {
      const res = await request(app.getHttpServer()).get('/api/videos');

      if (res.body.length > 0) {
        const video = res.body[0];
        expect(video).toHaveProperty('id');
        expect(video).toHaveProperty('vimeoId');
        expect(video).toHaveProperty('title');
      } else {
        expect(res.body).toEqual([]);
      }
    });
  });

  // ─── GET /api/videos/:id ──────────────────────────────────────────────────

  describe('GET /api/videos/:id', () => {
    it('returns 404 for an unknown UUID', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/videos/00000000-0000-0000-0000-000000000000');

      expect(res.status).toBe(404);
    });
  });

  // ─── POST /api/videos ─────────────────────────────────────────────────────

  describe('POST /api/videos', () => {
    it('returns 401 without authentication', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/videos')
        .send({
          vimeoId: '987654321',
          title: { de: 'Test-Video', en: 'Test Video', fa: 'ویدیو آزمایشی' },
        });

      expect(res.status).toBe(401);
    });

    it('creates a video with a valid JWT', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/videos')
        .set('Cookie', authCookies)
        .send({
          vimeoId: '111222333',
          title: { de: 'Integrations-Test Video', en: 'Integration Test Video', fa: 'ویدیو تست' },
          description: { de: 'Erstellt im Test', en: 'Created in test', fa: 'در آزمون ایجاد شد' },
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.vimeoId).toBe('111222333');
      expect(res.body.title.de).toBe('Integrations-Test Video');

      createdVideoId = res.body.id;
    });

    it('GET /api/videos/:id finds the newly created video', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/videos/${createdVideoId}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(createdVideoId);
      expect(res.body.vimeoId).toBe('111222333');
    });

    it('returns 400 for a non-numeric vimeoId', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/videos')
        .set('Cookie', authCookies)
        .send({
          vimeoId: 'not-a-number',
          title: { de: 'Test', en: 'Test', fa: 'تست' },
        });

      expect(res.status).toBe(400);
    });

    it('returns 409 when creating a video with an already-used vimeoId', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/videos')
        .set('Cookie', authCookies)
        .send({
          vimeoId: '111222333', // already taken by the video created above
          title: { de: 'Duplikat', en: 'Duplicate', fa: 'تکراری' },
        });

      expect(res.status).toBe(409);
    });
  });

  // ─── PATCH /api/videos/:id ────────────────────────────────────────────────

  describe('PATCH /api/videos/:id', () => {
    it('returns 401 without authentication', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/videos/${createdVideoId}`)
        .send({ title: { de: 'X', en: 'X', fa: 'X' } });

      expect(res.status).toBe(401);
    });

    it('updates the title with a valid JWT', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/videos/${createdVideoId}`)
        .set('Cookie', authCookies)
        .send({ title: { de: 'Aktualisiert', en: 'Updated', fa: 'به‌روز شد' } });

      expect(res.status).toBe(200);
      expect(res.body.title.de).toBe('Aktualisiert');
      expect(res.body.title.en).toBe('Updated');
    });

    it('returns 400 for a non-numeric vimeoId', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/videos/${createdVideoId}`)
        .set('Cookie', authCookies)
        .send({ vimeoId: 'not-a-number' });

      expect(res.status).toBe(400);
    });

    it('returns 409 when changing the vimeoId to one owned by another video', async () => {
      // second video with a distinct id
      const created = await request(app.getHttpServer())
        .post('/api/videos')
        .set('Cookie', authCookies)
        .send({
          vimeoId: '444555666',
          title: { de: 'Zweites', en: 'Second', fa: 'دومی' },
        });
      expect(created.status).toBe(201);
      secondVideoId = created.body.id;

      // try to steal the first video's vimeoId
      const res = await request(app.getHttpServer())
        .patch(`/api/videos/${secondVideoId}`)
        .set('Cookie', authCookies)
        .send({ vimeoId: '111222333' });

      expect(res.status).toBe(409);
    });

    it('allows re-saving a video with its own unchanged vimeoId', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/videos/${createdVideoId}`)
        .set('Cookie', authCookies)
        .send({ vimeoId: '111222333', title: { de: 'Erneut', en: 'Again', fa: 'دوباره' } });

      expect(res.status).toBe(200);
      expect(res.body.vimeoId).toBe('111222333');
    });
  });

  // ─── RBAC: authenticated non-admin (USER role) is forbidden ───────────────
  // Exercises the full JwtAuthGuard → RolesGuard chain: a logged-in USER (valid
  // cookie) without the ADMIN role must get 403, not 401.

  describe('RBAC — authenticated non-admin', () => {
    const userEmail = `video-nonadmin-${Date.now()}@example.com`;
    let userCookies: string[];

    beforeAll(async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: userEmail, password: testPassword });
      // deliberately NOT promoted to ADMIN — stays a normal USER
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: userEmail, password: testPassword });
      userCookies = loginRes.headers['set-cookie'] as unknown as string[];
    });

    afterAll(async () => {
      await prisma.user.deleteMany({ where: { email: userEmail } });
    });

    it('returns 403 on POST /api/videos (admin-only) for a logged-in non-admin', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/videos')
        .set('Cookie', userCookies)
        .send({
          vimeoId: '555000555',
          title: { de: 'Verboten', en: 'Forbidden', fa: 'ممنوع' },
        });

      expect(res.status).toBe(403);
    });
  });
});
