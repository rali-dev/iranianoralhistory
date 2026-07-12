import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CollectionApiService } from './collection-api.service';
import { ICollection } from '@iranianoralhistory/shared-contracts';

function buildCollection(id = 'col-uuid'): ICollection {
  return {
    id,
    slug: 'person-ali',
    type: 'PERSON',
    name: { de: 'Ali', en: 'Ali', fa: 'علی' },
    description: null,
    sortOrder: 0,
    videoCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe('CollectionApiService', () => {
  let service: CollectionApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CollectionApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(CollectionApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  describe('getAll()', () => {
    it('sends GET to /api/collections', () => {
      service.getAll().subscribe();

      const req = http.expectOne('/api/collections');
      expect(req.request.method).toBe('GET');
      req.flush([buildCollection()]);
    });

    it('returns the list of collections', (done) => {
      service.getAll().subscribe((result) => {
        expect(result).toHaveLength(2);
        done();
      });

      http.expectOne('/api/collections').flush([buildCollection('c1'), buildCollection('c2')]);
    });
  });

  describe('create()', () => {
    it('sends POST to /api/collections with the dto', () => {
      const dto = { slug: 'person-ali', type: 'PERSON' as const, name: { de: 'Ali', en: 'Ali', fa: 'علی' } };
      service.create(dto as any).subscribe();

      const req = http.expectOne('/api/collections');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush(buildCollection());
    });
  });

  describe('update()', () => {
    it('sends PATCH to /api/collections/:id', () => {
      service.update('col-uuid', { sortOrder: 5 }).subscribe();

      const req = http.expectOne('/api/collections/col-uuid');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ sortOrder: 5 });
      req.flush(buildCollection());
    });
  });

  describe('delete()', () => {
    it('sends DELETE to /api/collections/:id', () => {
      service.delete('col-uuid').subscribe();

      const req = http.expectOne('/api/collections/col-uuid');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('assignVideo()', () => {
    it('sends POST to /api/collections/:collectionId/videos/:videoId', () => {
      service.assignVideo('col-uuid', 'video-uuid').subscribe();

      const req = http.expectOne('/api/collections/col-uuid/videos/video-uuid');
      expect(req.request.method).toBe('POST');
      req.flush(null);
    });
  });

  describe('unassignVideo()', () => {
    it('sends DELETE to /api/collections/:collectionId/videos/:videoId', () => {
      service.unassignVideo('col-uuid', 'video-uuid').subscribe();

      const req = http.expectOne('/api/collections/col-uuid/videos/video-uuid');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});
