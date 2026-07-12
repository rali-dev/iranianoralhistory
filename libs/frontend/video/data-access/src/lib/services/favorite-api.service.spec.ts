import { TestBed } from '@angular/core/testing';
import { HttpInterceptorFn, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { FavoriteApiService } from './favorite-api.service';

const credentialsInterceptor: HttpInterceptorFn = (req, next) =>
  next(req.url.startsWith('/api') ? req.clone({ withCredentials: true }) : req);

describe('FavoriteApiService', () => {
  let service: FavoriteApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([credentialsInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(FavoriteApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  describe('getFavoriteVideoIds()', () => {
    it('sends GET to /api/users/me/favorites with withCredentials', () => {
      service.getFavoriteVideoIds().subscribe();

      const req = http.expectOne('/api/users/me/favorites');
      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBe(true);
      req.flush(['video-1', 'video-2']);
    });

    it('returns a list of video IDs', (done) => {
      service.getFavoriteVideoIds().subscribe((ids) => {
        expect(ids).toEqual(['video-1', 'video-2']);
        done();
      });

      http.expectOne('/api/users/me/favorites').flush(['video-1', 'video-2']);
    });
  });

  describe('addFavorite()', () => {
    it('sends POST to /api/videos/:videoId/favorite with withCredentials', () => {
      service.addFavorite('video-uuid').subscribe();

      const req = http.expectOne('/api/videos/video-uuid/favorite');
      expect(req.request.method).toBe('POST');
      expect(req.request.withCredentials).toBe(true);
      req.flush(null);
    });
  });

  describe('removeFavorite()', () => {
    it('sends DELETE to /api/videos/:videoId/favorite with withCredentials', () => {
      service.removeFavorite('video-uuid').subscribe();

      const req = http.expectOne('/api/videos/video-uuid/favorite');
      expect(req.request.method).toBe('DELETE');
      expect(req.request.withCredentials).toBe(true);
      req.flush(null);
    });
  });
});
