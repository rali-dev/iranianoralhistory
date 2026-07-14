import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '@iranianoralhistory/backend-shared-database';
import { createTestApp, stubbedSignedUrl } from '../support/app-helper';

jest.setTimeout(30000);

describe('Documents (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const adminEmail = `docs-admin-${Date.now()}@example.com`;
  const testPassword = 'Test1234!';
  let adminCookies: string[];
  let videoId: string;
  let documentId: string;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: adminEmail, password: testPassword });

    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: 'ADMIN' },
    });

    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: adminEmail, password: testPassword });

    adminCookies = loginRes.headers['set-cookie'] as unknown as string[];

    const videoRes = await request(app.getHttpServer())
      .post('/api/videos')
      .set('Cookie', adminCookies)
      .send({
        vimeoId: `${Date.now()}`,
        title: { de: 'Video mit Dok.', en: 'Video with Doc', fa: 'ویدیو با سند' },
      });

    videoId = videoRes.body.id;
  });

  afterAll(async () => {
    if (videoId) {
      await prisma.video.delete({ where: { id: videoId } }).catch(() => null);
    }
    await prisma.user.deleteMany({ where: { email: adminEmail } });
    await app.close();
  });

  // ─── POST /api/videos/:id/documents ──────────────────────────────────────

  describe('POST /api/videos/:id/documents', () => {
    it('returns 401 without authentication', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/videos/${videoId}/documents`)
        .send({ title: 'Document', storagePath: 'docs/test.pdf' });

      expect(res.status).toBe(401);
    });

    it('creates a document for a video', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/videos/${videoId}/documents`)
        .set('Cookie', adminCookies)
        .send({
          title: 'Source Report 2024',
          storagePath: 'documents/source-report-2024.pdf',
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.title).toBe('Source Report 2024');
      expect(res.body.videoId).toBe(videoId);

      documentId = res.body.id;
    });

    it('the document appears in the video response', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/videos/${videoId}`);

      expect(res.status).toBe(200);
      const docInVideo = res.body.documents?.find((d: { id: string }) => d.id === documentId);
      expect(docInVideo).toBeDefined();
      expect(docInVideo.title).toBe('Source Report 2024');
    });

    it('returns 400 when title is missing', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/videos/${videoId}/documents`)
        .set('Cookie', adminCookies)
        .send({ storagePath: 'docs/test.pdf' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when storagePath is missing', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/videos/${videoId}/documents`)
        .set('Cookie', adminCookies)
        .send({ title: 'No path' });

      expect(res.status).toBe(400);
      // Beweist, dass GENAU storagePath die Validierung auslöst (title ist gültig).
      expect(JSON.stringify(res.body.message)).toContain('storagePath');
    });
  });

  // ─── PATCH /api/videos/:id/documents/:docId ───────────────────────────────

  describe('PATCH /api/videos/:id/documents/:docId', () => {
    it('updates the document title', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/videos/${videoId}/documents/${documentId}`)
        .set('Cookie', adminCookies)
        .send({ title: 'Updated Report' });

      expect(res.status).toBe(200);
    });

    it('returns 401 without authentication', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/videos/${videoId}/documents/${documentId}`)
        .send({ title: 'New Title' });

      expect(res.status).toBe(401);
    });
  });

  // ─── DELETE /api/videos/:id/documents/:docId ──────────────────────────────

  describe('DELETE /api/videos/:id/documents/:docId', () => {
    it('returns 401 without authentication', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/videos/${videoId}/documents/${documentId}`);

      expect(res.status).toBe(401);
    });

    it('deletes a document', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/videos/${videoId}/documents/${documentId}`)
        .set('Cookie', adminCookies);

      expect(res.status).toBe(204);
    });

    it('the document is absent from the video after deletion', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/videos/${videoId}`);

      const docInVideo = res.body.documents?.find((d: { id: string }) => d.id === documentId);
      expect(docInVideo).toBeUndefined();
    });
  });

  // ─── GET /api/documents/:docId/signed-url ─────────────────────────────────
  // Öffentliches Archiv: Signed-URLs werden — wie die Videos — OHNE Login
  // ausgeliefert (kein JwtAuthGuard). Gäste und eingeloggte Nutzer erhalten den
  // 302-Redirect; unbekannte docIds liefern 404 (nicht 401).

  describe('GET /api/documents/:docId/signed-url (public)', () => {
    it('redirects (302) a GUEST (no auth) to the signed URL of an existing document', async () => {
      const storagePath = 'documents/public-guest-access.pdf';
      const createRes = await request(app.getHttpServer())
        .post(`/api/videos/${videoId}/documents`)
        .set('Cookie', adminCookies)
        .send({ title: 'Public Guest Doc', storagePath });
      const freshDocId = createRes.body.id as string;

      const res = await request(app.getHttpServer())
        .get(`/api/documents/${freshDocId}/signed-url`)
        .redirects(0);

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe(stubbedSignedUrl(storagePath, 3600));

      await prisma.document.delete({ where: { id: freshDocId } }).catch(() => null);
    });

    it('returns 404 (not 401) for an unknown document without authentication', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/documents/00000000-0000-0000-0000-000000000000/signed-url')
        .redirects(0);

      expect(res.status).toBe(404);
    });

    // Positivpfad: authentifiziert + existierendes Dokument → 302-Redirect auf
    // die (im Test gestubbte) Signed-URL. Der erwartete Location-Header beweist,
    // dass der korrekte storagePath mit Default-Ablauf (3600s) an den Storage-
    // Port gereicht wurde. Eigenes Dokument, da das obige oben gelöscht wurde.
    it('redirects (302) an authenticated user to the signed URL of an existing document', async () => {
      const storagePath = 'documents/signed-url-positive.pdf';
      const createRes = await request(app.getHttpServer())
        .post(`/api/videos/${videoId}/documents`)
        .set('Cookie', adminCookies)
        .send({ title: 'Signed URL Doc', storagePath });
      const freshDocId = createRes.body.id as string;

      const res = await request(app.getHttpServer())
        .get(`/api/documents/${freshDocId}/signed-url`)
        .set('Cookie', adminCookies)
        .redirects(0);

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe(stubbedSignedUrl(storagePath, 3600));

      await prisma.document.delete({ where: { id: freshDocId } }).catch(() => null);
    });
  });

  // ─── RBAC: authenticated non-admin (USER role) is forbidden ───────────────
  // Document mutations are admin-only. The RolesGuard denies before the handler
  // runs, so the docId need not exist for these 403 assertions.

  describe('RBAC — authenticated non-admin', () => {
    const userEmail = `docs-nonadmin-${Date.now()}@example.com`;
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

    it('403 on POST /api/videos/:id/documents', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/videos/${videoId}/documents`)
        .set('Cookie', userCookies)
        .send({ title: 'Nope', storagePath: 'docs/nope.pdf' });
      expect(res.status).toBe(403);
    });

    it('403 on PATCH /api/videos/:id/documents/:docId', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/videos/${videoId}/documents/00000000-0000-0000-0000-000000000000`)
        .set('Cookie', userCookies)
        .send({ title: 'Nope' });
      expect(res.status).toBe(403);
    });

    it('403 on DELETE /api/videos/:id/documents/:docId', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/videos/${videoId}/documents/00000000-0000-0000-0000-000000000000`)
        .set('Cookie', userCookies);
      expect(res.status).toBe(403);
    });

    // Policy (bewusst): Signed-URLs sind öffentlich — weder Login noch Admin-Rolle
    // nötig. Ein Nicht-Admin erhält daher (wie ein Gast) für ein unbekanntes
    // Dokument 404 — kein 401/403.
    it('GET signed-url is allowed for a non-admin user too — unknown doc → 404, not 401/403', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/documents/00000000-0000-0000-0000-000000000000/signed-url')
        .set('Cookie', userCookies)
        .redirects(0);

      expect(res.status).toBe(404);
    });
  });

  // ─── Rate-Limit: Abuse-Schutz des jetzt ÖFFENTLICHEN Endpoints ────────────
  // Da die Route ohne Login erreichbar ist, ist das enge Per-Route-Throttle
  // (30/60s) die zentrale Bremse gegen docId-Enumeration. Dieser Test sichert,
  // dass es erhalten bleibt — würde jemand @Throttle entfernen, fiele die Route
  // still auf das globale 100/min zurück, ohne dass ein Test bricht. Läuft
  // bewusst ZULETZT: er trippt den Zähler dieser Route für das restliche
  // 60s-Fenster, daher isoliert am Dateiende.

  describe('GET /api/documents/:docId/signed-url — rate limiting (public abuse guard)', () => {
    it('throttles (429) once the per-route limit of guest requests is exceeded', async () => {
      const server = app.getHttpServer();
      const statuses: number[] = [];
      // Route-Limit ist 30/60s. 31 Gast-Anfragen müssen mindestens einmal 429
      // sehen. Ein unbekanntes (valide geformtes) docId genügt — der
      // ThrottlerGuard zählt VOR dem Handler, unabhängig vom 404-Ergebnis.
      for (let i = 0; i < 31; i++) {
        const res = await request(server)
          .get('/api/documents/00000000-0000-0000-0000-000000000000/signed-url')
          .redirects(0);
        statuses.push(res.status);
      }

      expect(statuses.filter((s) => s === 429).length).toBeGreaterThan(0);
    });
  });
});
