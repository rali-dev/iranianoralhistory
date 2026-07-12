import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '@iranianoralhistory/backend-shared-database';
import { createTestApp } from '../support/app-helper';

jest.setTimeout(30000);

describe('Favorites (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const userEmail = `favorites-user-${Date.now()}@example.com`;
  const adminEmail = `favorites-admin-${Date.now()}@example.com`;
  const testPassword = 'Test1234!';
  let userCookies: string[];
  let adminCookies: string[];
  let videoId: string;
  let userId: string;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());

    // create a regular user
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: userEmail, password: testPassword });

    const userLoginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: userEmail, password: testPassword });

    userCookies = userLoginRes.headers['set-cookie'] as unknown as string[];
    const userProfile = await request(app.getHttpServer())
      .get('/api/users/me')
      .set('Cookie', userCookies);
    userId = userProfile.body.id;

    // create an admin for video setup
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: adminEmail, password: testPassword });

    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: 'ADMIN' },
    });

    const adminLoginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: adminEmail, password: testPassword });

    adminCookies = adminLoginRes.headers['set-cookie'] as unknown as string[];

    const videoRes = await request(app.getHttpServer())
      .post('/api/videos')
      .set('Cookie', adminCookies)
      .send({
        vimeoId: `${Date.now()}`,
        title: { de: 'Favoriten-Test', en: 'Favorites Test', fa: 'تست علاقه' },
      });

    videoId = videoRes.body.id;
  });

  afterAll(async () => {
    if (videoId) {
      await prisma.video.delete({ where: { id: videoId } }).catch(() => null);
    }
    await prisma.user.deleteMany({ where: { email: { in: [userEmail, adminEmail] } } });
    await app.close();
  });

  // ─── GET /api/users/me/favorites ──────────────────────────────────────────

  describe('GET /api/users/me/favorites', () => {
    it('returns an empty list when the user has no favourites', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/users/me/favorites')
        .set('Cookie', userCookies);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('returns 401 without authentication', async () => {
      const res = await request(app.getHttpServer()).get('/api/users/me/favorites');
      expect(res.status).toBe(401);
    });
  });

  // ─── POST /api/videos/:videoId/favorite ───────────────────────────────────

  describe('POST /api/videos/:videoId/favorite', () => {
    it('adds a video to favourites', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/videos/${videoId}/favorite`)
        .set('Cookie', userCookies);

      expect(res.status).toBe(204);
    });

    it('the video appears in the favourites list after being added', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/users/me/favorites')
        .set('Cookie', userCookies);

      expect(res.status).toBe(200);
      expect(res.body).toContain(videoId);
    });

    it('returns 401 without authentication', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/videos/${videoId}/favorite`);

      expect(res.status).toBe(401);
    });
  });

  // ─── DELETE /api/videos/:videoId/favorite ─────────────────────────────────

  describe('DELETE /api/videos/:videoId/favorite', () => {
    it('removes a favourite', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/videos/${videoId}/favorite`)
        .set('Cookie', userCookies);

      expect(res.status).toBe(204);
    });

    it('the video is absent from the favourites list after removal', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/users/me/favorites')
        .set('Cookie', userCookies);

      expect(res.status).toBe(200);
      expect(res.body).not.toContain(videoId);
    });

    it('returns 401 without authentication', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/videos/${videoId}/favorite`);

      expect(res.status).toBe(401);
    });
  });
});
