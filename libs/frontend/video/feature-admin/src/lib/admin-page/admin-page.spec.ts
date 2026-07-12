import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { AdminPageComponent } from './admin-page';
import { VideoApiService, CollectionApiService } from '@iranianoralhistory/frontend-video-data-access';
import { I18nService } from '@iranianoralhistory/frontend-shared-i18n';

function buildVideo(id = 'v-1') {
  return {
    id,
    vimeoId: '111222',
    title: { de: 'Titel', en: 'Title', fa: 'عنوان' },
    description: null,
    documents: [{ id: 'doc-1', title: 'Dok', storagePath: 'docs/dok.pdf' }],
    collections: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function buildCollection(id = 'col-1', type: 'PERSON' | 'TOPIC' = 'PERSON') {
  return {
    id,
    slug: 'person-ali',
    type,
    name: { de: 'Ali', en: 'Ali', fa: 'علی' },
    description: null,
    sortOrder: 0,
    videoCount: 0,
  };
}

const mockVideoApi = {
  getAll:         jest.fn(),
  update:         jest.fn(),
  delete:         jest.fn(),
  deleteDocument: jest.fn(),
  addDocument:    jest.fn(),
};

const mockCollectionApi = {
  getAll:         jest.fn(),
  update:         jest.fn(),
  delete:         jest.fn(),
  create:         jest.fn(),
  assignVideo:    jest.fn(),
  unassignVideo:  jest.fn(),
};

const mockI18n = {
  t: jest.fn().mockImplementation((key: string) => key),
  lang: jest.fn().mockReturnValue('de'),
};

async function createComponent() {
  await TestBed.configureTestingModule({
    imports: [AdminPageComponent],
    providers: [
      { provide: VideoApiService,      useValue: mockVideoApi },
      { provide: CollectionApiService, useValue: mockCollectionApi },
      { provide: I18nService,          useValue: mockI18n },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(AdminPageComponent);
  return { fixture, component: fixture.componentInstance };
}

describe('AdminPageComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('ngOnInit()', () => {
    it('loads videos and collections on init', async () => {
      mockVideoApi.getAll.mockReturnValue(of([buildVideo()]));
      mockCollectionApi.getAll.mockReturnValue(of([buildCollection()]));
      const { component } = await createComponent();

      component.ngOnInit();

      expect(component.videos()).toHaveLength(1);
      expect(component.collections()).toHaveLength(1);
      expect(component.videosLoading()).toBe(false);
      expect(component.collectionsLoading()).toBe(false);
    });

    it('sets videosLoading to false on error', async () => {
      mockVideoApi.getAll.mockReturnValue(throwError(() => new Error('fail')));
      mockCollectionApi.getAll.mockReturnValue(of([]));
      const { component } = await createComponent();

      component.ngOnInit();

      expect(component.videosLoading()).toBe(false);
    });
  });

  describe('setTab()', () => {
    it('changes the active tab', async () => {
      mockVideoApi.getAll.mockReturnValue(of([]));
      mockCollectionApi.getAll.mockReturnValue(of([]));
      const { component } = await createComponent();

      component.setTab('collections');

      expect(component.activeTab()).toBe('collections');
    });
  });

  describe('onVideoCreated()', () => {
    it('prepends the new video to the list', async () => {
      mockVideoApi.getAll.mockReturnValue(of([buildVideo('v-1')]));
      mockCollectionApi.getAll.mockReturnValue(of([]));
      const { component } = await createComponent();
      component.ngOnInit();

      component.onVideoCreated(buildVideo('v-new') as any);

      expect(component.videos()[0].id).toBe('v-new');
      expect(component.videos()).toHaveLength(2);
    });
  });

  describe('onCollectionCreated()', () => {
    it('prepends the new collection to the list', async () => {
      mockVideoApi.getAll.mockReturnValue(of([]));
      mockCollectionApi.getAll.mockReturnValue(of([buildCollection('col-1')]));
      const { component } = await createComponent();
      component.ngOnInit();

      component.onCollectionCreated(buildCollection('col-new') as any);

      expect(component.collections()[0].id).toBe('col-new');
      expect(component.collections()).toHaveLength(2);
    });
  });

  describe('toggleDocuments()', () => {
    it('expands a video row when collapsed', async () => {
      mockVideoApi.getAll.mockReturnValue(of([]));
      mockCollectionApi.getAll.mockReturnValue(of([]));
      const { component } = await createComponent();

      component.toggleDocuments('v-1');

      expect(component.expandedVideoId()).toBe('v-1');
    });

    it('collapses a video row when already expanded', async () => {
      mockVideoApi.getAll.mockReturnValue(of([]));
      mockCollectionApi.getAll.mockReturnValue(of([]));
      const { component } = await createComponent();
      component.expandedVideoId.set('v-1');

      component.toggleDocuments('v-1');

      expect(component.expandedVideoId()).toBeNull();
    });
  });

  describe('startEditVideo() / cancelEditVideo()', () => {
    it('populates editing state from the video', async () => {
      mockVideoApi.getAll.mockReturnValue(of([]));
      mockCollectionApi.getAll.mockReturnValue(of([]));
      const { component } = await createComponent();
      const video = buildVideo();

      component.startEditVideo(video as any);

      expect(component.editingVideoId()).toBe('v-1');
      expect(component.editingVideoState()?.titleDe).toBe('Titel');
    });

    it('clears editing state on cancel', async () => {
      mockVideoApi.getAll.mockReturnValue(of([]));
      mockCollectionApi.getAll.mockReturnValue(of([]));
      const { component } = await createComponent();
      component.startEditVideo(buildVideo() as any);

      component.cancelEditVideo();

      expect(component.editingVideoId()).toBeNull();
      expect(component.editingVideoState()).toBeNull();
    });
  });

  describe('saveEditVideo()', () => {
    it('calls videoApi.update and updates the video in the list', async () => {
      const updated = { ...buildVideo(), title: { de: 'Neu', en: 'New', fa: 'جدید' } };
      mockVideoApi.getAll.mockReturnValue(of([buildVideo()]));
      mockCollectionApi.getAll.mockReturnValue(of([]));
      mockVideoApi.update.mockReturnValue(of(updated));
      const { component } = await createComponent();
      component.ngOnInit();
      component.startEditVideo(buildVideo() as any);

      component.saveEditVideo('v-1');

      expect(mockVideoApi.update).toHaveBeenCalledWith('v-1', expect.any(Object));
      expect(component.editingVideoId()).toBeNull();
    });

    it('sets savingVideoId to null on error', async () => {
      mockVideoApi.getAll.mockReturnValue(of([buildVideo()]));
      mockCollectionApi.getAll.mockReturnValue(of([]));
      mockVideoApi.update.mockReturnValue(throwError(() => new Error('fail')));
      const { component } = await createComponent();
      component.ngOnInit();
      component.startEditVideo(buildVideo() as any);

      component.saveEditVideo('v-1');

      expect(component.savingVideoId()).toBeNull();
    });
  });

  describe('confirmDeleteVideo()', () => {
    it('removes the video from the list on success', async () => {
      mockVideoApi.getAll.mockReturnValue(of([buildVideo('v-1'), buildVideo('v-2')]));
      mockCollectionApi.getAll.mockReturnValue(of([]));
      mockVideoApi.delete.mockReturnValue(of(undefined));
      const { component } = await createComponent();
      component.ngOnInit();

      component.confirmDeleteVideo('v-1');

      expect(component.videos()).toHaveLength(1);
      expect(component.videos()[0].id).toBe('v-2');
    });

    it('collapses the expanded row when the deleted video was expanded', async () => {
      mockVideoApi.getAll.mockReturnValue(of([buildVideo()]));
      mockCollectionApi.getAll.mockReturnValue(of([]));
      mockVideoApi.delete.mockReturnValue(of(undefined));
      const { component } = await createComponent();
      component.ngOnInit();
      component.expandedVideoId.set('v-1');

      component.confirmDeleteVideo('v-1');

      expect(component.expandedVideoId()).toBeNull();
    });
  });

  describe('confirmDeleteDoc()', () => {
    it('removes the document from the video in the list', async () => {
      mockVideoApi.getAll.mockReturnValue(of([buildVideo()]));
      mockCollectionApi.getAll.mockReturnValue(of([]));
      mockVideoApi.deleteDocument.mockReturnValue(of(undefined));
      const { component } = await createComponent();
      component.ngOnInit();

      component.confirmDeleteDoc('v-1', 'doc-1');

      const video = component.videos().find((v) => v.id === 'v-1');
      expect(video?.documents).toHaveLength(0);
    });
  });

  describe('onDocumentAdded()', () => {
    it('appends the new document to the matching video live (no reload)', async () => {
      mockVideoApi.getAll.mockReturnValue(of([buildVideo('v-1')]));
      mockCollectionApi.getAll.mockReturnValue(of([]));
      const { component } = await createComponent();
      component.ngOnInit();

      const newDoc = { id: 'doc-2', title: 'Neu', storagePath: 'docs/neu.pdf', videoId: 'v-1', createdAt: new Date() };
      component.onDocumentAdded('v-1', newDoc as any);

      const video = component.videos().find((v) => v.id === 'v-1');
      expect(video?.documents).toHaveLength(2);
      expect(video?.documents.at(-1)?.id).toBe('doc-2');
    });

    it('leaves other videos untouched', async () => {
      mockVideoApi.getAll.mockReturnValue(of([buildVideo('v-1'), buildVideo('v-2')]));
      mockCollectionApi.getAll.mockReturnValue(of([]));
      const { component } = await createComponent();
      component.ngOnInit();

      const newDoc = { id: 'doc-x', title: 'X', storagePath: 'docs/x.pdf', videoId: 'v-1', createdAt: new Date() };
      component.onDocumentAdded('v-1', newDoc as any);

      const other = component.videos().find((v) => v.id === 'v-2');
      expect(other?.documents).toHaveLength(1);
    });
  });

  describe('availableCollections() / assign / unassign', () => {
    function videoWith(collections: any[] = []) {
      return { ...buildVideo('v-1'), collections };
    }

    it('availableCollections excludes already-assigned collections', async () => {
      const assigned = { id: 'col-1', slug: 's', type: 'TOPIC', name: { de: 'A', en: 'A', fa: 'A' } };
      mockVideoApi.getAll.mockReturnValue(of([videoWith([assigned])]));
      mockCollectionApi.getAll.mockReturnValue(of([
        buildCollection('col-1', 'TOPIC'),
        buildCollection('col-2', 'PERSON'),
      ]));
      const { component } = await createComponent();
      component.ngOnInit();

      const available = component.availableCollections(component.videos()[0] as any);

      expect(available.map((c) => c.id)).toEqual(['col-2']);
    });

    it('assignCollection adds the collection to the video live and clears the selection', async () => {
      mockVideoApi.getAll.mockReturnValue(of([videoWith([])]));
      mockCollectionApi.getAll.mockReturnValue(of([buildCollection('col-1', 'TOPIC')]));
      mockCollectionApi.assignVideo.mockReturnValue(of(undefined));
      const { component } = await createComponent();
      component.ngOnInit();

      component.assignTargetId.set('col-1');
      component.assignCollection('v-1');

      expect(mockCollectionApi.assignVideo).toHaveBeenCalledWith('col-1', 'v-1');
      const video = component.videos().find((v) => v.id === 'v-1');
      expect(video?.collections.some((c) => c.id === 'col-1')).toBe(true);
      expect(component.assignTargetId()).toBe('');
      expect(component.collections().find((c) => c.id === 'col-1')?.videoCount).toBe(1);
    });

    it('unassignCollection removes the collection from the video live', async () => {
      const assigned = { id: 'col-1', slug: 's', type: 'TOPIC', name: { de: 'A', en: 'A', fa: 'A' } };
      mockVideoApi.getAll.mockReturnValue(of([videoWith([assigned])]));
      mockCollectionApi.getAll.mockReturnValue(of([{ ...buildCollection('col-1', 'TOPIC'), videoCount: 1 }]));
      mockCollectionApi.unassignVideo.mockReturnValue(of(undefined));
      const { component } = await createComponent();
      component.ngOnInit();

      component.unassignCollection('v-1', 'col-1');

      expect(mockCollectionApi.unassignVideo).toHaveBeenCalledWith('col-1', 'v-1');
      const video = component.videos().find((v) => v.id === 'v-1');
      expect(video?.collections).toHaveLength(0);
      expect(component.collections().find((c) => c.id === 'col-1')?.videoCount).toBe(0);
    });
  });

  describe('computed: persons / topics', () => {
    it('persons returns only PERSON type collections', async () => {
      mockVideoApi.getAll.mockReturnValue(of([]));
      mockCollectionApi.getAll.mockReturnValue(of([
        buildCollection('col-1', 'PERSON'),
        buildCollection('col-2', 'TOPIC'),
      ]));
      const { component } = await createComponent();
      component.ngOnInit();

      expect(component.persons()).toHaveLength(1);
      expect(component.topics()).toHaveLength(1);
    });
  });

  describe('onCategoryCreated()', () => {
    it('prepends the new category to the collections list', async () => {
      mockVideoApi.getAll.mockReturnValue(of([]));
      mockCollectionApi.getAll.mockReturnValue(of([buildCollection('col-1', 'TOPIC')]));
      const { component } = await createComponent();
      component.ngOnInit();

      component.onCategoryCreated(buildCollection('cat-new', 'TOPIC') as any);

      expect(component.collections()[0].id).toBe('cat-new');
      expect(component.collections()).toHaveLength(2);
    });
  });

  describe('startEditCollection() / cancelEditCollection()', () => {
    it('populates editing state from the collection', async () => {
      mockVideoApi.getAll.mockReturnValue(of([]));
      mockCollectionApi.getAll.mockReturnValue(of([]));
      const { component } = await createComponent();

      component.startEditCollection(buildCollection('col-1') as any);

      expect(component.editingCollectionId()).toBe('col-1');
      expect(component.editingCollectionState()?.nameDe).toBe('Ali');
      expect(component.editingCollectionState()?.slug).toBe('person-ali');
      expect(component.editingCollectionState()?.sortOrder).toBe(0);
    });

    it('clears editing state on cancel', async () => {
      mockVideoApi.getAll.mockReturnValue(of([]));
      mockCollectionApi.getAll.mockReturnValue(of([]));
      const { component } = await createComponent();
      component.startEditCollection(buildCollection('col-1') as any);

      component.cancelEditCollection();

      expect(component.editingCollectionId()).toBeNull();
      expect(component.editingCollectionState()).toBeNull();
    });
  });

  describe('saveEditCollection()', () => {
    it('updates the collection in the list and shows the collection status on success', async () => {
      const updated = { ...buildCollection('col-1'), name: { de: 'Neu', en: 'New', fa: 'جدید' } };
      mockVideoApi.getAll.mockReturnValue(of([]));
      mockCollectionApi.getAll.mockReturnValue(of([buildCollection('col-1')]));
      mockCollectionApi.update.mockReturnValue(of(updated));
      const { component } = await createComponent();
      component.ngOnInit();
      component.startEditCollection(buildCollection('col-1') as any);

      component.saveEditCollection('col-1', false);

      expect(mockCollectionApi.update).toHaveBeenCalledWith('col-1', expect.any(Object));
      expect(component.collections()[0].name.de).toBe('Neu');
      expect(component.editingCollectionId()).toBeNull();
      expect(component.savingCollectionId()).toBeNull();
      expect(component.statusMsg()).toBe('ADMIN.COL.SAVED');
    });

    it('shows the category status key when saving a category (isCategory branch)', async () => {
      const updated = { ...buildCollection('cat-1', 'TOPIC'), name: { de: 'Kat', en: 'Cat', fa: 'دسته' } };
      mockVideoApi.getAll.mockReturnValue(of([]));
      mockCollectionApi.getAll.mockReturnValue(of([buildCollection('cat-1', 'TOPIC')]));
      mockCollectionApi.update.mockReturnValue(of(updated));
      const { component } = await createComponent();
      component.ngOnInit();
      component.startEditCollection(buildCollection('cat-1', 'TOPIC') as any);

      component.saveEditCollection('cat-1', true);

      expect(component.statusMsg()).toBe('ADMIN.CAT.SAVED');
    });

    it('maps a 409 to the collection duplicate-slug key on error', async () => {
      mockVideoApi.getAll.mockReturnValue(of([]));
      mockCollectionApi.getAll.mockReturnValue(of([buildCollection('col-1')]));
      mockCollectionApi.update.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409 })));
      const { component } = await createComponent();
      component.ngOnInit();
      component.startEditCollection(buildCollection('col-1') as any);

      component.saveEditCollection('col-1', false);

      expect(component.savingCollectionId()).toBeNull();
      expect(component.errorMsg()).toBe('ADMIN.COL.ERR_DUPLICATE_SLUG');
    });

    it('maps a 409 to the category duplicate-slug key on error (isCategory branch)', async () => {
      mockVideoApi.getAll.mockReturnValue(of([]));
      mockCollectionApi.getAll.mockReturnValue(of([buildCollection('cat-1', 'TOPIC')]));
      mockCollectionApi.update.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409 })));
      const { component } = await createComponent();
      component.ngOnInit();
      component.startEditCollection(buildCollection('cat-1', 'TOPIC') as any);

      component.saveEditCollection('cat-1', true);

      expect(component.errorMsg()).toBe('ADMIN.CAT.ERR_DUPLICATE_SLUG');
    });

    it('returns early without calling update when no editing state is set', async () => {
      mockVideoApi.getAll.mockReturnValue(of([]));
      mockCollectionApi.getAll.mockReturnValue(of([]));
      const { component } = await createComponent();

      component.saveEditCollection('col-1', false);

      expect(mockCollectionApi.update).not.toHaveBeenCalled();
    });
  });

  describe('confirmDeleteCollection()', () => {
    it('removes the collection and shows the collection status on success (isCategory false)', async () => {
      mockVideoApi.getAll.mockReturnValue(of([]));
      mockCollectionApi.getAll.mockReturnValue(of([buildCollection('col-1'), buildCollection('col-2')]));
      mockCollectionApi.delete.mockReturnValue(of(undefined));
      const { component } = await createComponent();
      component.ngOnInit();

      component.confirmDeleteCollection('col-1', false);

      expect(component.collections().map((c) => c.id)).toEqual(['col-2']);
      expect(component.collectionDelete.deletingId()).toBeNull();
      expect(component.statusMsg()).toBe('ADMIN.DELETE_COL_OK');
    });

    it('shows the category status key on success (isCategory true)', async () => {
      mockVideoApi.getAll.mockReturnValue(of([]));
      mockCollectionApi.getAll.mockReturnValue(of([buildCollection('cat-1', 'TOPIC')]));
      mockCollectionApi.delete.mockReturnValue(of(undefined));
      const { component } = await createComponent();
      component.ngOnInit();

      component.confirmDeleteCollection('cat-1', true);

      expect(component.collections()).toHaveLength(0);
      expect(component.statusMsg()).toBe('ADMIN.DELETE_CAT_OK');
    });

    it('keeps the collection and shows the delete error on failure', async () => {
      mockVideoApi.getAll.mockReturnValue(of([]));
      mockCollectionApi.getAll.mockReturnValue(of([buildCollection('col-1')]));
      mockCollectionApi.delete.mockReturnValue(throwError(() => new Error('fail')));
      const { component } = await createComponent();
      component.ngOnInit();

      component.confirmDeleteCollection('col-1', false);

      expect(component.collections()).toHaveLength(1);
      expect(component.collectionDelete.deletingId()).toBeNull();
      expect(component.errorMsg()).toBe('ADMIN.ERR_DELETE');
    });
  });

  describe('assignCollection() — error & not-found', () => {
    function videoWith(collections: any[] = []) {
      return { ...buildVideo('v-1'), collections };
    }

    it('returns early without calling the API when the collection is not found', async () => {
      mockVideoApi.getAll.mockReturnValue(of([videoWith([])]));
      mockCollectionApi.getAll.mockReturnValue(of([buildCollection('col-1', 'TOPIC')]));
      const { component } = await createComponent();
      component.ngOnInit();

      component.assignTargetId.set('ghost');
      component.assignCollection('v-1');

      expect(mockCollectionApi.assignVideo).not.toHaveBeenCalled();
      expect(component.assigningVideoId()).toBeNull();
    });

    it('clears the in-flight id and shows the update error on failure', async () => {
      mockVideoApi.getAll.mockReturnValue(of([videoWith([])]));
      mockCollectionApi.getAll.mockReturnValue(of([buildCollection('col-1', 'TOPIC')]));
      mockCollectionApi.assignVideo.mockReturnValue(throwError(() => new Error('fail')));
      const { component } = await createComponent();
      component.ngOnInit();

      component.assignTargetId.set('col-1');
      component.assignCollection('v-1');

      expect(mockCollectionApi.assignVideo).toHaveBeenCalledWith('col-1', 'v-1');
      expect(component.assigningVideoId()).toBeNull();
      expect(component.errorMsg()).toBe('ADMIN.ERR_UPDATE');
    });
  });

  describe('unassignCollection() — error', () => {
    it('shows the update error on failure', async () => {
      const assigned = { id: 'col-1', slug: 's', type: 'TOPIC', name: { de: 'A', en: 'A', fa: 'A' } };
      mockVideoApi.getAll.mockReturnValue(of([{ ...buildVideo('v-1'), collections: [assigned] }]));
      mockCollectionApi.getAll.mockReturnValue(of([{ ...buildCollection('col-1', 'TOPIC'), videoCount: 1 }]));
      mockCollectionApi.unassignVideo.mockReturnValue(throwError(() => new Error('fail')));
      const { component } = await createComponent();
      component.ngOnInit();

      component.unassignCollection('v-1', 'col-1');

      expect(component.errorMsg()).toBe('ADMIN.ERR_UPDATE');
      const video = component.videos().find((v) => v.id === 'v-1');
      expect(video?.collections).toHaveLength(1);
    });
  });

  describe('confirmDeleteVideo() / confirmDeleteDoc() — error branches', () => {
    it('confirmDeleteVideo keeps the video and shows the delete error on failure', async () => {
      mockVideoApi.getAll.mockReturnValue(of([buildVideo('v-1')]));
      mockCollectionApi.getAll.mockReturnValue(of([]));
      mockVideoApi.delete.mockReturnValue(throwError(() => new Error('fail')));
      const { component } = await createComponent();
      component.ngOnInit();

      component.confirmDeleteVideo('v-1');

      expect(component.videos()).toHaveLength(1);
      expect(component.videoDelete.deletingId()).toBeNull();
      expect(component.errorMsg()).toBe('ADMIN.ERR_DELETE');
    });

    it('confirmDeleteDoc keeps the document and shows the delete error on failure', async () => {
      mockVideoApi.getAll.mockReturnValue(of([buildVideo('v-1')]));
      mockCollectionApi.getAll.mockReturnValue(of([]));
      mockVideoApi.deleteDocument.mockReturnValue(throwError(() => new Error('fail')));
      const { component } = await createComponent();
      component.ngOnInit();

      component.confirmDeleteDoc('v-1', 'doc-1');

      const video = component.videos().find((v) => v.id === 'v-1');
      expect(video?.documents).toHaveLength(1);
      expect(component.docDelete.deletingId()).toBeNull();
      expect(component.errorMsg()).toBe('ADMIN.ERR_DELETE');
    });
  });

  describe('updateErrorKey() mapping (via saveEditVideo error path)', () => {
    async function failSaveWith(status: number) {
      mockVideoApi.getAll.mockReturnValue(of([buildVideo('v-1')]));
      mockCollectionApi.getAll.mockReturnValue(of([]));
      mockVideoApi.update.mockReturnValue(throwError(() => new HttpErrorResponse({ status })));
      const { component } = await createComponent();
      component.ngOnInit();
      component.startEditVideo(buildVideo('v-1') as any);
      component.saveEditVideo('v-1');
      return component;
    }

    it('maps 409 to the conflict (duplicate) key', async () => {
      const component = await failSaveWith(409);
      expect(component.errorMsg()).toBe('ADMIN.VIDEO.ERR_DUPLICATE');
    });

    it('maps 400 to the bad-request (invalid vimeo) key', async () => {
      const component = await failSaveWith(400);
      expect(component.errorMsg()).toBe('ADMIN.VIDEO.ERR_INVALID_VIMEO');
    });

    it('maps any other status to the generic update error', async () => {
      const component = await failSaveWith(500);
      expect(component.errorMsg()).toBe('ADMIN.ERR_UPDATE');
    });
  });

  describe('saveEditVideo() — hasDesc null-vs-object branch', () => {
    it('sends description: null when all description fields are empty', async () => {
      mockVideoApi.getAll.mockReturnValue(of([buildVideo('v-1')]));
      mockCollectionApi.getAll.mockReturnValue(of([]));
      mockVideoApi.update.mockReturnValue(of(buildVideo('v-1')));
      const { component } = await createComponent();
      component.ngOnInit();
      component.startEditVideo(buildVideo('v-1') as any);

      component.saveEditVideo('v-1');

      expect(mockVideoApi.update).toHaveBeenCalledWith(
        'v-1',
        expect.objectContaining({ description: null }),
      );
    });

    it('sends a description object when at least one description field is filled', async () => {
      const withDesc = { ...buildVideo('v-1'), description: { de: 'D', en: 'E', fa: 'F' } };
      mockVideoApi.getAll.mockReturnValue(of([withDesc]));
      mockCollectionApi.getAll.mockReturnValue(of([]));
      mockVideoApi.update.mockReturnValue(of(withDesc));
      const { component } = await createComponent();
      component.ngOnInit();
      component.startEditVideo(withDesc as any);

      component.saveEditVideo('v-1');

      expect(mockVideoApi.update).toHaveBeenCalledWith(
        'v-1',
        expect.objectContaining({ description: { de: 'D', en: 'E', fa: 'F' } }),
      );
    });
  });

  describe('showStatus / showError auto-dismiss (fake timers)', () => {
    it('clears the status toast after 3000ms', async () => {
      mockVideoApi.getAll.mockReturnValue(of([buildVideo('v-1')]));
      mockCollectionApi.getAll.mockReturnValue(of([]));
      mockVideoApi.delete.mockReturnValue(of(undefined));
      const { component } = await createComponent();
      component.ngOnInit();

      component.confirmDeleteVideo('v-1');
      expect(component.statusMsg()).toBe('ADMIN.DELETE_VIDEO_OK');

      jest.advanceTimersByTime(3000);
      expect(component.statusMsg()).toBeNull();
    });

    it('clears the error toast after 4000ms', async () => {
      mockVideoApi.getAll.mockReturnValue(of([buildVideo('v-1')]));
      mockCollectionApi.getAll.mockReturnValue(of([]));
      mockVideoApi.delete.mockReturnValue(throwError(() => new Error('fail')));
      const { component } = await createComponent();
      component.ngOnInit();

      component.confirmDeleteVideo('v-1');
      expect(component.errorMsg()).toBe('ADMIN.ERR_DELETE');

      jest.advanceTimersByTime(4000);
      expect(component.errorMsg()).toBeNull();
    });

    it('showStatus clears a pending error message', async () => {
      mockVideoApi.getAll.mockReturnValue(of([buildVideo('v-1')]));
      mockCollectionApi.getAll.mockReturnValue(of([]));
      mockVideoApi.deleteDocument.mockReturnValue(throwError(() => new Error('fail')));
      mockVideoApi.delete.mockReturnValue(of(undefined));
      const { component } = await createComponent();
      component.ngOnInit();

      component.confirmDeleteDoc('v-1', 'doc-1');
      expect(component.errorMsg()).toBe('ADMIN.ERR_DELETE');

      component.confirmDeleteVideo('v-1');
      expect(component.statusMsg()).toBe('ADMIN.DELETE_VIDEO_OK');
      expect(component.errorMsg()).toBeNull();
    });

    it('showError clears a pending status message', async () => {
      mockVideoApi.getAll.mockReturnValue(of([buildVideo('v-1'), buildVideo('v-2')]));
      mockCollectionApi.getAll.mockReturnValue(of([]));
      mockVideoApi.delete
        .mockReturnValueOnce(of(undefined))
        .mockReturnValueOnce(throwError(() => new Error('fail')));
      const { component } = await createComponent();
      component.ngOnInit();

      component.confirmDeleteVideo('v-1');
      expect(component.statusMsg()).toBe('ADMIN.DELETE_VIDEO_OK');

      component.confirmDeleteVideo('v-2');
      expect(component.errorMsg()).toBe('ADMIN.ERR_DELETE');
      expect(component.statusMsg()).toBeNull();
    });
  });
});
