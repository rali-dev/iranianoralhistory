import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '@iranianoralhistory/backend-shared-database';
import { createTestApp } from '../support/app-helper';

jest.setTimeout(30000);

describe('Collections (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const testEmail = `collection-test-${Date.now()}@example.com`;
  const testPassword = 'Test1234!';
  let adminCookies: string[];
  let createdCollectionId: string;
  let createdVideoId: string;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());

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

    adminCookies = loginRes.headers['set-cookie'] as unknown as string[];

    const videoRes = await request(app.getHttpServer())
      .post('/api/videos')
      .set('Cookie', adminCookies)
      .send({
        vimeoId: `${Date.now()}`,
        title: { de: 'Test-Video', en: 'Test Video', fa: 'ویدیو' },
      });

    createdVideoId = videoRes.body.id;
  });

  afterAll(async () => {
    if (createdCollectionId) {
      await prisma.collection.delete({ where: { id: createdCollectionId } }).catch(() => null);
    }
    if (createdVideoId) {
      await prisma.video.delete({ where: { id: createdVideoId } }).catch(() => null);
    }
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await app.close();
  });

  // ─── GET /api/collections ─────────────────────────────────────────────────

  describe('GET /api/collections', () => {
    it('returns a list (public endpoint, no auth required)', async () => {
      const res = await request(app.getHttpServer()).get('/api/collections');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ─── POST /api/collections ────────────────────────────────────────────────

  describe('POST /api/collections', () => {
    it('returns 401 without authentication', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/collections')
        .send({
          slug: 'test-collection',
          type: 'TOPIC',
          name: { de: 'Test', en: 'Test', fa: 'تست' },
        });

      expect(res.status).toBe(401);
    });

    it('creates a collection as admin', async () => {
      const slug = `collection-${Date.now()}`;
      const res = await request(app.getHttpServer())
        .post('/api/collections')
        .set('Cookie', adminCookies)
        .send({
          slug,
          type: 'TOPIC',
          name: { de: 'Thema Eins', en: 'Topic One', fa: 'موضوع یک' },
          sortOrder: 1,
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.slug).toBe(slug);
      expect(res.body.type).toBe('TOPIC');

      createdCollectionId = res.body.id;
    });

    it('creates a PERSON collection', async () => {
      const slug = `person-${Date.now()}`;
      const res = await request(app.getHttpServer())
        .post('/api/collections')
        .set('Cookie', adminCookies)
        .send({
          slug,
          type: 'PERSON',
          name: { de: 'Dr. Muster', en: 'Dr. Example', fa: 'دکتر نمونه' },
        });

      expect(res.status).toBe(201);
      expect(res.body.type).toBe('PERSON');

      await prisma.collection.delete({ where: { id: res.body.id } }).catch(() => null);
    });

    it('returns 400 when slug is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/collections')
        .set('Cookie', adminCookies)
        .send({
          type: 'TOPIC',
          name: { de: 'Ohne Slug', en: 'No Slug', fa: 'بدون اسلاگ' },
        });

      expect(res.status).toBe(400);
    });
  });

  // ─── PATCH /api/collections/:id ──────────────────────────────────────────

  describe('PATCH /api/collections/:id', () => {
    it('updates a collection as admin', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/collections/${createdCollectionId}`)
        .set('Cookie', adminCookies)
        .send({ sortOrder: 99 });

      expect(res.status).toBe(200);
    });

    it('returns 401 without authentication', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/collections/${createdCollectionId}`)
        .send({ sortOrder: 5 });

      expect(res.status).toBe(401);
    });
  });

  // ─── POST /api/collections/:id/videos/:videoId ───────────────────────────

  describe('POST /api/collections/:id/videos/:videoId', () => {
    it('assigns a video to a collection', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/collections/${createdCollectionId}/videos/${createdVideoId}`)
        .set('Cookie', adminCookies);

      expect(res.status).toBe(201);
    });

    it('returns 401 without authentication', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/collections/${createdCollectionId}/videos/${createdVideoId}`);

      expect(res.status).toBe(401);
    });
  });

  // ─── DELETE /api/collections/:id/videos/:videoId ─────────────────────────

  describe('DELETE /api/collections/:id/videos/:videoId', () => {
    it('unassigns a video from a collection (204)', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/collections/${createdCollectionId}/videos/${createdVideoId}`)
        .set('Cookie', adminCookies);

      expect(res.status).toBe(204);
    });

    it('is idempotent — unassigning again still returns 204', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/collections/${createdCollectionId}/videos/${createdVideoId}`)
        .set('Cookie', adminCookies);

      expect(res.status).toBe(204);
    });

    it('returns 401 without authentication', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/collections/${createdCollectionId}/videos/${createdVideoId}`);

      expect(res.status).toBe(401);
    });
  });

  // ─── DELETE /api/collections/:id ─────────────────────────────────────────

  describe('DELETE /api/collections/:id', () => {
    it('returns 401 without authentication', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/collections/${createdCollectionId}`);

      expect(res.status).toBe(401);
    });
  });
});
