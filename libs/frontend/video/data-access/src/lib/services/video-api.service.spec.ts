import { TestBed } from '@angular/core/testing';
import { HttpInterceptorFn, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { VideoApiService } from './video-api.service';
import { IVideo } from '@iranianoralhistory/shared-contracts';

const credentialsInterceptor: HttpInterceptorFn = (req, next) =>
  next(req.url.startsWith('/api') ? req.clone({ withCredentials: true }) : req);

function buildVideoDto(): IVideo {
  return {
    id: 'video-uuid',
    vimeoId: '123456789',
    title: { de: 'Titel', en: 'Title', fa: 'عنوان' },
    description: null,
    documents: [],
    collections: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe('VideoApiService', () => {
  let service: VideoApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        VideoApiService,
        provideHttpClient(withInterceptors([credentialsInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(VideoApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  describe('getAll()', () => {
    it('sends GET to /api/videos', () => {
      service.getAll().subscribe();

      const req = http.expectOne('/api/videos');
      expect(req.request.method).toBe('GET');
      req.flush([buildVideoDto()]);
    });

    it('returns the list of videos', (done) => {
      const videos = [buildVideoDto(), { ...buildVideoDto(), id: 'v-2' }];

      service.getAll().subscribe((result) => {
        expect(result).toHaveLength(2);
        done();
      });

      http.expectOne('/api/videos').flush(videos);
    });
  });

  describe('getById()', () => {
    it('sends GET to /api/videos/:id', () => {
      service.getById('video-uuid').subscribe();

      const req = http.expectOne('/api/videos/video-uuid');
      expect(req.request.method).toBe('GET');
      req.flush(buildVideoDto());
    });
  });

  describe('create()', () => {
    it('sends POST to /api/videos with withCredentials', () => {
      service.create({
        vimeoId: '123',
        title: { de: 'T', en: 'T', fa: 'ت' },
      }).subscribe();

      const req = http.expectOne('/api/videos');
      expect(req.request.method).toBe('POST');
      expect(req.request.withCredentials).toBe(true);
      req.flush(buildVideoDto());
    });
  });

  describe('update()', () => {
    it('sends PATCH to /api/videos/:id with withCredentials', () => {
      service.update('video-uuid', { vimeoId: '999' }).subscribe();

      const req = http.expectOne('/api/videos/video-uuid');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.withCredentials).toBe(true);
      req.flush(buildVideoDto());
    });
  });

  describe('delete()', () => {
    it('sends DELETE to /api/videos/:id with withCredentials', () => {
      service.delete('video-uuid').subscribe();

      const req = http.expectOne('/api/videos/video-uuid');
      expect(req.request.method).toBe('DELETE');
      expect(req.request.withCredentials).toBe(true);
      req.flush(null);
    });
  });

  describe('addDocument()', () => {
    it('sends POST to /api/videos/:videoId/documents', () => {
      service.addDocument('video-uuid', {
        title: 'Document',
        storagePath: 'docs/test.pdf',
        videoId: 'video-uuid',
      }).subscribe();

      const req = http.expectOne('/api/videos/video-uuid/documents');
      expect(req.request.method).toBe('POST');
      expect(req.request.withCredentials).toBe(true);
      req.flush({ id: 'doc-uuid', title: 'Document' });
    });
  });

  describe('deleteDocument()', () => {
    it('sends DELETE to /api/videos/:videoId/documents/:docId', () => {
      service.deleteDocument('video-uuid', 'doc-uuid').subscribe();

      const req = http.expectOne('/api/videos/video-uuid/documents/doc-uuid');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('getThumbnail()', () => {
    it('caches the result on repeated calls', (done) => {
      let callCount = 0;
      const url = `https://vimeo.com/api/oembed.json?url=https://vimeo.com/123&width=640`;

      service.getThumbnail('123').subscribe(() => {
        callCount++;

        service.getThumbnail('123').subscribe(() => {
          callCount++;
          expect(callCount).toBe(2);
          done();
        });
      });

      http.expectOne(url).flush({ thumbnail_url: 'https://i.vimeocdn.com/thumb.jpg' });
      http.expectNone(url);
    });

    it('returns null on an API error', (done) => {
      service.getThumbnail('999').subscribe((result) => {
        expect(result).toBeNull();
        done();
      });

      http.expectOne(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/999&width=640`)
        .error(new ProgressEvent('error'));
    });
  });
});
