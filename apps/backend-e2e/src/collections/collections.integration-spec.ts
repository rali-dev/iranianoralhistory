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

    // Unique-Constraint auf slug → Prisma P2002 → PrismaExceptionFilter → 409.
    it('returns 409 when the slug already exists', async () => {
      const slug = `dup-${Date.now()}`;
      const first = await request(app.getHttpServer())
        .post('/api/collections')
        .set('Cookie', adminCookies)
        .send({ slug, type: 'TOPIC', name: { de: 'Dup', en: 'Dup', fa: 'تکراری' } });
      expect(first.status).toBe(201);

      const second = await request(app.getHttpServer())
        .post('/api/collections')
        .set('Cookie', adminCookies)
        .send({ slug, type: 'TOPIC', name: { de: 'Dup2', en: 'Dup2', fa: 'تکراری۲' } });
      expect(second.status).toBe(409);

      await prisma.collection.delete({ where: { id: first.body.id } }).catch(() => null);
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

    it('deletes a collection as admin (204)', async () => {
      // throwaway collection so shared fixtures stay intact
      const created = await request(app.getHttpServer())
        .post('/api/collections')
        .set('Cookie', adminCookies)
        .send({
          slug: `throwaway-${Date.now()}`,
          type: 'TOPIC',
          name: { de: 'Wegwerf', en: 'Throwaway', fa: 'یکبارمصرف' },
        });
      expect(created.status).toBe(201);

      const del = await request(app.getHttpServer())
        .delete(`/api/collections/${created.body.id}`)
        .set('Cookie', adminCookies);

      expect(del.status).toBe(204);
    });
  });

  // ─── Negative paths (Prisma errors → 4xx, not raw 500) ───────────────────
  // Ein angelegtes-und-sofort-gelöschtes Objekt liefert eine gültig geformte,
  // garantiert nicht existierende id — format-agnostisch für PATCH/DELETE/FK.

  describe('Negative paths', () => {
    let goneCollectionId: string;

    beforeAll(async () => {
      const created = await request(app.getHttpServer())
        .post('/api/collections')
        .set('Cookie', adminCookies)
        .send({ slug: `gone-${Date.now()}`, type: 'TOPIC', name: { de: 'Weg', en: 'Gone', fa: 'رفته' } });
      goneCollectionId = created.body.id;
      await prisma.collection.delete({ where: { id: goneCollectionId } }).catch(() => null);
    });

    it('PATCH on an unknown collection id returns 404 (P2025), not 500', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/collections/${goneCollectionId}`)
        .set('Cookie', adminCookies)
        .send({ sortOrder: 1 });
      expect(res.status).toBe(404);
    });

    it('DELETE on an unknown collection id returns 404 (P2025), not 500', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/collections/${goneCollectionId}`)
        .set('Cookie', adminCookies);
      expect(res.status).toBe(404);
    });

    it('assigning a video to an unknown collection returns 400 (P2003 FK), not 500', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/collections/${goneCollectionId}/videos/${createdVideoId}`)
        .set('Cookie', adminCookies);
      expect(res.status).toBe(400);
      // Body-Message pinnt die URSACHE auf den FK-Filter — so kann der Test nicht
      // versehentlich durch einen (anders verursachten) Validierungs-400 grün werden.
      expect(res.body.message).toBe(
        'The operation references a related record that does not exist.',
      );
    });
  });

  // ─── RBAC: authenticated non-admin (USER role) is forbidden ───────────────
  // Every collection mutation is admin-only; a logged-in USER must get 403.

  describe('RBAC — authenticated non-admin', () => {
    const userEmail = `collection-nonadmin-${Date.now()}@example.com`;
    let userCookies: string[];

    beforeAll(async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: userEmail, password: testPassword });
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: userEmail, password: testPassword });
      userCookies = loginRes.headers['set-cookie'] as unknown as string[];
    });

    afterAll(async () => {
      await prisma.user.deleteMany({ where: { email: userEmail } });
    });

    it('403 on POST /api/collections', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/collections')
        .set('Cookie', userCookies)
        .send({ slug: `x-${Date.now()}`, type: 'TOPIC', name: { de: 'X', en: 'X', fa: 'X' } });
      expect(res.status).toBe(403);
    });

    it('403 on PATCH /api/collections/:id', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/collections/${createdCollectionId}`)
        .set('Cookie', userCookies)
        .send({ sortOrder: 1 });
      expect(res.status).toBe(403);
    });

    it('403 on DELETE /api/collections/:id', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/collections/${createdCollectionId}`)
        .set('Cookie', userCookies);
      expect(res.status).toBe(403);
    });

    it('403 on POST /api/collections/:id/videos/:videoId', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/collections/${createdCollectionId}/videos/${createdVideoId}`)
        .set('Cookie', userCookies);
      expect(res.status).toBe(403);
    });

    it('403 on DELETE /api/collections/:id/videos/:videoId', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/collections/${createdCollectionId}/videos/${createdVideoId}`)
        .set('Cookie', userCookies);
      expect(res.status).toBe(403);
    });
  });
});
