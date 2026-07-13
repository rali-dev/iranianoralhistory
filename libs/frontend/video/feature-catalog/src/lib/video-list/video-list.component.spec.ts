import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { VideoListComponent } from './video-list.component';
import {
  VideoApiService,
  CollectionApiService,
  FavoriteApiService,
  favoritesStore,
} from '@iranianoralhistory/frontend-video-data-access';
import { authStore } from '@iranianoralhistory/frontend-identity-data-access';
import { I18nService } from '@iranianoralhistory/frontend-shared-i18n';
import { DomSanitizer } from '@angular/platform-browser';

function buildVideo(id = 'v-1', extra: object = {}) {
  return {
    id,
    vimeoId: '111222333',
    title: { de: 'Titel', en: 'Title', fa: 'عنوان' },
    description: { de: 'Beschreibung', en: 'Description', fa: 'توضیح' },
    documents: [],
    collections: [{ id: 'col-1', slug: 'person-ali', name: { de: 'Ali', en: 'Ali', fa: 'علی' } }],
    ...extra,
  };
}

function buildCollection(slug = 'person-ali', type: 'PERSON' | 'TOPIC' = 'PERSON') {
  return {
    id: 'col-1',
    slug,
    type,
    name: { de: 'Ali', en: 'Ali', fa: 'علی' },
    description: null,
    sortOrder: 0,
  };
}

const mockVideoApi: Partial<VideoApiService> = {
  getAll: jest.fn(),
  getThumbnail: jest.fn().mockReturnValue(of(null)),
};

const mockCollectionApi: Partial<CollectionApiService> = {
  getAll: jest.fn(),
};

const mockFavoriteApi: Partial<FavoriteApiService> = {
  addFavorite: jest.fn(),
  removeFavorite: jest.fn(),
};

const mockI18n = {
  lang: jest.fn().mockReturnValue('de'),
  isRtl: jest.fn().mockReturnValue(false),
  t: jest.fn().mockImplementation((key: string) => key),
};

const mockSanitizer = {
  bypassSecurityTrustResourceUrl: jest.fn().mockImplementation((url: string) => url),
};

async function createComponent() {
  await TestBed.configureTestingModule({
    imports: [VideoListComponent],
    providers: [
      { provide: VideoApiService,      useValue: mockVideoApi },
      { provide: CollectionApiService, useValue: mockCollectionApi },
      { provide: FavoriteApiService,   useValue: mockFavoriteApi },
      { provide: I18nService,          useValue: mockI18n },
      { provide: DomSanitizer,         useValue: mockSanitizer },
      { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(VideoListComponent);
  const component = fixture.componentInstance;
  return { fixture, component };
}

describe('VideoListComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockI18n.lang.mockReturnValue('de');
    mockI18n.isRtl.mockReturnValue(false);
    favoritesStore.setIds([]);
    authStore.clear();
  });

  describe('ngOnInit()', () => {
    it('loads videos on init and sets isLoading to false on success', async () => {
      (mockVideoApi.getAll as jest.Mock).mockReturnValue(of([buildVideo()]));
      (mockCollectionApi.getAll as jest.Mock).mockReturnValue(of([]));

      const { component } = await createComponent();
      component.ngOnInit();

      expect(component.isLoading()).toBe(false);
      expect(component.videos()).toHaveLength(1);
    });

    it('sets apiError when video loading fails', async () => {
      (mockVideoApi.getAll as jest.Mock).mockReturnValue(
        throwError(() => ({ status: 500, message: 'Server Error', statusText: 'Internal Server Error' })),
      );
      (mockCollectionApi.getAll as jest.Mock).mockReturnValue(of([]));

      const { component } = await createComponent();
      component.ngOnInit();

      expect(component.apiError()).toContain('HTTP 500');
    });

    it('loads collections and sets collectionsLoading to false on success', async () => {
      (mockVideoApi.getAll as jest.Mock).mockReturnValue(of([]));
      (mockCollectionApi.getAll as jest.Mock).mockReturnValue(of([buildCollection()]));

      const { component } = await createComponent();
      component.ngOnInit();

      expect(component.collectionsLoading()).toBe(false);
      expect(component.collections()).toHaveLength(1);
    });

    it('activates favorites filter when route has ?favorites=true', async () => {
      (mockVideoApi.getAll as jest.Mock).mockReturnValue(of([]));
      (mockCollectionApi.getAll as jest.Mock).mockReturnValue(of([]));

      await TestBed.configureTestingModule({
        imports: [VideoListComponent],
        providers: [
          { provide: VideoApiService,      useValue: mockVideoApi },
          { provide: CollectionApiService, useValue: mockCollectionApi },
          { provide: FavoriteApiService,   useValue: mockFavoriteApi },
          { provide: I18nService,          useValue: mockI18n },
          { provide: DomSanitizer,         useValue: mockSanitizer },
          { provide: ActivatedRoute, useValue: { queryParams: of({ favorites: 'true' }) } },
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(VideoListComponent);
      fixture.componentInstance.ngOnInit();

      expect(fixture.componentInstance.showFavoritesOnly()).toBe(true);
      expect(fixture.componentInstance.isListView()).toBe(true);
    });
  });

  describe('selectCollection()', () => {
    it('sets the selected slug and clears showFavoritesOnly', async () => {
      (mockVideoApi.getAll as jest.Mock).mockReturnValue(of([]));
      (mockCollectionApi.getAll as jest.Mock).mockReturnValue(of([]));
      const { component } = await createComponent();

      component.showFavoritesOnly.set(true);
      component.selectCollection('person-ali');

      expect(component.selectedSlug()).toBe('person-ali');
      expect(component.showFavoritesOnly()).toBe(false);
    });

    it('deselects the slug when the same slug is selected again', async () => {
      (mockVideoApi.getAll as jest.Mock).mockReturnValue(of([]));
      (mockCollectionApi.getAll as jest.Mock).mockReturnValue(of([]));
      const { component } = await createComponent();

      component.selectedSlug.set('person-ali');
      component.selectCollection('person-ali');

      expect(component.selectedSlug()).toBeNull();
    });

    it('closes the filter dropdown after selection', async () => {
      (mockVideoApi.getAll as jest.Mock).mockReturnValue(of([]));
      (mockCollectionApi.getAll as jest.Mock).mockReturnValue(of([]));
      const { component } = await createComponent();

      component.filterOpen.set(true);
      component.selectCollection('person-ali');

      expect(component.filterOpen()).toBe(false);
    });
  });

  describe('selectFavoritesFilter()', () => {
    it('enables favorites-only mode and sets list view', async () => {
      (mockVideoApi.getAll as jest.Mock).mockReturnValue(of([]));
      (mockCollectionApi.getAll as jest.Mock).mockReturnValue(of([]));
      const { component } = await createComponent();

      component.selectFavoritesFilter();

      expect(component.showFavoritesOnly()).toBe(true);
      expect(component.isListView()).toBe(true);
      expect(component.selectedSlug()).toBeNull();
    });

    it('toggles favorites mode off when already active', async () => {
      (mockVideoApi.getAll as jest.Mock).mockReturnValue(of([]));
      (mockCollectionApi.getAll as jest.Mock).mockReturnValue(of([]));
      const { component } = await createComponent();

      component.showFavoritesOnly.set(true);
      component.selectFavoritesFilter();

      expect(component.showFavoritesOnly()).toBe(false);
    });
  });

  describe('videos computed()', () => {
    it('filters by collection slug', async () => {
      const v1 = buildVideo('v-1', { collections: [{ id: 'col-1', slug: 'person-ali', name: { de: 'Ali', en: 'Ali', fa: 'علی' } }] });
      const v2 = buildVideo('v-2', { collections: [] });
      (mockVideoApi.getAll as jest.Mock).mockReturnValue(of([v1, v2]));
      (mockCollectionApi.getAll as jest.Mock).mockReturnValue(of([]));
      const { component } = await createComponent();
      component.ngOnInit();

      component.selectedSlug.set('person-ali');

      expect(component.videos()).toHaveLength(1);
      expect(component.videos()[0].id).toBe('v-1');
    });

    it('filters by favorites when showFavoritesOnly is true', async () => {
      const v1 = buildVideo('v-1');
      const v2 = buildVideo('v-2');
      (mockVideoApi.getAll as jest.Mock).mockReturnValue(of([v1, v2]));
      (mockCollectionApi.getAll as jest.Mock).mockReturnValue(of([]));
      favoritesStore.setIds(['v-1']);
      const { component } = await createComponent();
      component.ngOnInit();

      component.showFavoritesOnly.set(true);

      expect(component.videos()).toHaveLength(1);
      expect(component.videos()[0].id).toBe('v-1');
    });

    it('filters by search query across all title languages', async () => {
      const v1 = buildVideo('v-1', { title: { de: 'Heidegger', en: 'Heidegger', fa: 'هایدگر' } });
      const v2 = buildVideo('v-2', { title: { de: 'Andere', en: 'Other', fa: 'دیگری' } });
      (mockVideoApi.getAll as jest.Mock).mockReturnValue(of([v1, v2]));
      (mockCollectionApi.getAll as jest.Mock).mockReturnValue(of([]));
      const { component } = await createComponent();
      component.ngOnInit();

      component.searchQuery.set('heidegger');

      expect(component.videos()).toHaveLength(1);
      expect(component.videos()[0].id).toBe('v-1');
    });
  });

  describe('toggleFavorite()', () => {
    it('does nothing when user is not authenticated', async () => {
      (mockVideoApi.getAll as jest.Mock).mockReturnValue(of([]));
      (mockCollectionApi.getAll as jest.Mock).mockReturnValue(of([]));
      const { component } = await createComponent();
      authStore.setUser(null);

      const event = { stopPropagation: jest.fn() } as unknown as MouseEvent;
      component.toggleFavorite(event, 'v-1');

      expect(mockFavoriteApi.addFavorite).not.toHaveBeenCalled();
    });

    it('calls addFavorite API and adds to store (optimistic)', async () => {
      (mockVideoApi.getAll as jest.Mock).mockReturnValue(of([]));
      (mockCollectionApi.getAll as jest.Mock).mockReturnValue(of([]));
      (mockFavoriteApi.addFavorite as jest.Mock).mockReturnValue(of(undefined));
      const { component } = await createComponent();
      authStore.setUser({ id: 'u-1', email: 'u@t.de', role: 'USER', createdAt: new Date(), updatedAt: new Date() });

      const event = { stopPropagation: jest.fn() } as unknown as MouseEvent;
      component.toggleFavorite(event, 'v-99');

      expect(favoritesStore.ids().has('v-99')).toBe(true);
      expect(mockFavoriteApi.addFavorite).toHaveBeenCalledWith('v-99');
    });

    it('removes from store and calls removeFavorite when already a favorite', async () => {
      (mockVideoApi.getAll as jest.Mock).mockReturnValue(of([]));
      (mockCollectionApi.getAll as jest.Mock).mockReturnValue(of([]));
      (mockFavoriteApi.removeFavorite as jest.Mock).mockReturnValue(of(undefined));
      favoritesStore.setIds(['v-99']);
      const { component } = await createComponent();
      authStore.setUser({ id: 'u-1', email: 'u@t.de', role: 'USER', createdAt: new Date(), updatedAt: new Date() });

      const event = { stopPropagation: jest.fn() } as unknown as MouseEvent;
      component.toggleFavorite(event, 'v-99');

      expect(favoritesStore.ids().has('v-99')).toBe(false);
      expect(mockFavoriteApi.removeFavorite).toHaveBeenCalledWith('v-99');
    });
  });

  describe('openModal() / closeModal()', () => {
    it('sets selectedVideo and modalOpen to true on openModal', async () => {
      (mockVideoApi.getAll as jest.Mock).mockReturnValue(of([]));
      (mockCollectionApi.getAll as jest.Mock).mockReturnValue(of([]));
      const { component } = await createComponent();
      const video = buildVideo();

      component.openModal(video as any);

      expect(component.selectedVideo()).toEqual(video);
      expect(component.modalOpen()).toBe(true);
    });

    it('clears selectedVideo and modalOpen on closeModal', async () => {
      (mockVideoApi.getAll as jest.Mock).mockReturnValue(of([]));
      (mockCollectionApi.getAll as jest.Mock).mockReturnValue(of([]));
      const { component } = await createComponent();
      component.selectedVideo.set(buildVideo() as any);
      component.modalOpen.set(true);

      component.closeModal();

      expect(component.selectedVideo()).toBeNull();
      expect(component.modalOpen()).toBe(false);
    });

    it('locks body scroll on openModal and restores it on closeModal', async () => {
      (mockVideoApi.getAll as jest.Mock).mockReturnValue(of([]));
      (mockCollectionApi.getAll as jest.Mock).mockReturnValue(of([]));
      const { component } = await createComponent();

      component.openModal(buildVideo() as any);
      expect(document.body.style.overflow).toBe('hidden');

      component.closeModal();
      expect(document.body.style.overflow).toBe('');
    });

    it('exits fullscreen on closeModal when a fullscreen element is active', async () => {
      (mockVideoApi.getAll as jest.Mock).mockReturnValue(of([]));
      (mockCollectionApi.getAll as jest.Mock).mockReturnValue(of([]));
      const { component } = await createComponent();

      const exitFullscreen = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(document, 'fullscreenElement', {
        configurable: true,
        value: document.createElement('div'),
      });
      Object.defineProperty(document, 'exitFullscreen', {
        configurable: true,
        value: exitFullscreen,
      });

      component.closeModal();

      expect(exitFullscreen).toHaveBeenCalled();

      // Restore the jsdom defaults so the mocked fullscreen state doesn't leak.
      delete (document as unknown as Record<string, unknown>)['fullscreenElement'];
      delete (document as unknown as Record<string, unknown>)['exitFullscreen'];
    });
  });

  describe('onSearchInput() / clearSearch()', () => {
    it('updates searchQuery from the input event', async () => {
      (mockVideoApi.getAll as jest.Mock).mockReturnValue(of([]));
      (mockCollectionApi.getAll as jest.Mock).mockReturnValue(of([]));
      const { component } = await createComponent();

      const event = { target: { value: 'test search' } } as unknown as Event;
      component.onSearchInput(event);

      expect(component.searchQuery()).toBe('test search');
    });

    it('clears searchQuery on clearSearch()', async () => {
      (mockVideoApi.getAll as jest.Mock).mockReturnValue(of([]));
      (mockCollectionApi.getAll as jest.Mock).mockReturnValue(of([]));
      const { component } = await createComponent();
      component.searchQuery.set('some query');

      component.clearSearch();

      expect(component.searchQuery()).toBe('');
    });
  });

  describe('computed helpers', () => {
    it('personCollections returns only PERSON type collections', async () => {
      (mockVideoApi.getAll as jest.Mock).mockReturnValue(of([]));
      (mockCollectionApi.getAll as jest.Mock).mockReturnValue(of([]));
      const { component } = await createComponent();
      component.collections.set([
        buildCollection('person-ali', 'PERSON') as any,
        buildCollection('topic-exile', 'TOPIC') as any,
      ]);

      expect(component.personCollections()).toHaveLength(1);
      expect(component.personCollections()[0].type).toBe('PERSON');
    });

    it('topicCollections returns only TOPIC type collections', async () => {
      (mockVideoApi.getAll as jest.Mock).mockReturnValue(of([]));
      (mockCollectionApi.getAll as jest.Mock).mockReturnValue(of([]));
      const { component } = await createComponent();
      component.collections.set([
        buildCollection('person-ali', 'PERSON') as any,
        buildCollection('topic-exile', 'TOPIC') as any,
      ]);

      expect(component.topicCollections()).toHaveLength(1);
      expect(component.topicCollections()[0].type).toBe('TOPIC');
    });

    it('hasActiveFilter is true when a slug is selected', async () => {
      (mockVideoApi.getAll as jest.Mock).mockReturnValue(of([]));
      (mockCollectionApi.getAll as jest.Mock).mockReturnValue(of([]));
      const { component } = await createComponent();

      component.selectedSlug.set('person-ali');

      expect(component.hasActiveFilter()).toBe(true);
    });
  });

  describe('toggleFavorite() error rollback', () => {
    it('rolls back the optimistic add when addFavorite errors', async () => {
      (mockVideoApi.getAll as jest.Mock).mockReturnValue(of([]));
      (mockCollectionApi.getAll as jest.Mock).mockReturnValue(of([]));
      (mockFavoriteApi.addFavorite as jest.Mock).mockReturnValue(throwError(() => new Error('fail')));
      const { component } = await createComponent();
      authStore.setUser({ id: 'u-1', email: 'u@t.de', role: 'USER', createdAt: new Date(), updatedAt: new Date() });

      const event = { stopPropagation: jest.fn() } as unknown as MouseEvent;
      component.toggleFavorite(event, 'v-err');

      expect(mockFavoriteApi.addFavorite).toHaveBeenCalledWith('v-err');
      expect(favoritesStore.ids().has('v-err')).toBe(false);
    });

    it('rolls back the optimistic remove when removeFavorite errors', async () => {
      (mockVideoApi.getAll as jest.Mock).mockReturnValue(of([]));
      (mockCollectionApi.getAll as jest.Mock).mockReturnValue(of([]));
      (mockFavoriteApi.removeFavorite as jest.Mock).mockReturnValue(throwError(() => new Error('fail')));
      favoritesStore.setIds(['v-keep']);
      const { component } = await createComponent();
      authStore.setUser({ id: 'u-1', email: 'u@t.de', role: 'USER', createdAt: new Date(), updatedAt: new Date() });

      const event = { stopPropagation: jest.fn() } as unknown as MouseEvent;
      component.toggleFavorite(event, 'v-keep');

      expect(mockFavoriteApi.removeFavorite).toHaveBeenCalledWith('v-keep');
      expect(favoritesStore.ids().has('v-keep')).toBe(true);
    });
  });

  describe('toggleFilter() and panel navigation', () => {
    it('opens the dropdown without resetting the panel', async () => {
      (mockVideoApi.getAll as jest.Mock).mockReturnValue(of([]));
      (mockCollectionApi.getAll as jest.Mock).mockReturnValue(of([]));
      const { component } = await createComponent();
      component.collectionPanel.set('persons');

      const event = { stopPropagation: jest.fn() } as unknown as MouseEvent;
      component.toggleFilter(event);

      expect(event.stopPropagation).toHaveBeenCalled();
      expect(component.filterOpen()).toBe(true);
      expect(component.collectionPanel()).toBe('persons');
    });

    it('closes the dropdown and resets the panel to main', async () => {
      (mockVideoApi.getAll as jest.Mock).mockReturnValue(of([]));
      (mockCollectionApi.getAll as jest.Mock).mockReturnValue(of([]));
      const { component } = await createComponent();
      component.filterOpen.set(true);
      component.collectionPanel.set('type-select');

      const event = { stopPropagation: jest.fn() } as unknown as MouseEvent;
      component.toggleFilter(event);

      expect(component.filterOpen()).toBe(false);
      expect(component.collectionPanel()).toBe('main');
    });

    it('navigates forward and back through the collection panels', async () => {
      (mockVideoApi.getAll as jest.Mock).mockReturnValue(of([]));
      (mockCollectionApi.getAll as jest.Mock).mockReturnValue(of([]));
      const { component } = await createComponent();

      component.openCollections();
      expect(component.collectionPanel()).toBe('type-select');

      component.openPersons();
      expect(component.collectionPanel()).toBe('persons');

      component.goBackToTypeSelect();
      expect(component.collectionPanel()).toBe('type-select');

      component.openTopics();
      expect(component.collectionPanel()).toBe('topics');

      component.goBackToMain();
      expect(component.collectionPanel()).toBe('main');
    });
  });

  describe('onDocumentClick()', () => {
    it('closes the filter dropdown and resets the panel when clicking outside', async () => {
      (mockVideoApi.getAll as jest.Mock).mockReturnValue(of([]));
      (mockCollectionApi.getAll as jest.Mock).mockReturnValue(of([]));
      const { component } = await createComponent();
      component.filterOpen.set(true);
      component.collectionPanel.set('persons');

      const outside = document.createElement('div');
      component.onDocumentClick({ target: outside } as unknown as MouseEvent);

      expect(component.filterOpen()).toBe(false);
      expect(component.collectionPanel()).toBe('main');
    });

    it('keeps the dropdown open when the click is inside .filter-dropdown', async () => {
      (mockVideoApi.getAll as jest.Mock).mockReturnValue(of([]));
      (mockCollectionApi.getAll as jest.Mock).mockReturnValue(of([]));
      const { component } = await createComponent();
      component.filterOpen.set(true);
      component.collectionPanel.set('type-select');

      const inside = document.createElement('div');
      inside.className = 'filter-dropdown';
      component.onDocumentClick({ target: inside } as unknown as MouseEvent);

      expect(component.filterOpen()).toBe(true);
      expect(component.collectionPanel()).toBe('type-select');
    });
  });

  describe('onEscapeKey()', () => {
    it('closes the modal when it is open', async () => {
      (mockVideoApi.getAll as jest.Mock).mockReturnValue(of([]));
      (mockCollectionApi.getAll as jest.Mock).mockReturnValue(of([]));
      const { component } = await createComponent();
      component.selectedVideo.set(buildVideo() as any);
      component.modalOpen.set(true);

      component.onEscapeKey();

      expect(component.modalOpen()).toBe(false);
      expect(component.selectedVideo()).toBeNull();
    });

    it('closes the doc drawer when no modal is open', async () => {
      (mockVideoApi.getAll as jest.Mock).mockReturnValue(of([]));
      (mockCollectionApi.getAll as jest.Mock).mockReturnValue(of([]));
      const { component } = await createComponent();
      component.docDrawerVideo.set(buildVideo() as any);

      component.onEscapeKey();

      expect(component.docDrawerVideo()).toBeNull();
    });
  });

  describe('handleCardKey()', () => {
    it('opens the modal on Enter and prevents default', async () => {
      (mockVideoApi.getAll as jest.Mock).mockReturnValue(of([]));
      (mockCollectionApi.getAll as jest.Mock).mockReturnValue(of([]));
      const { component } = await createComponent();
      const video = buildVideo();
      const event = { key: 'Enter', preventDefault: jest.fn() } as unknown as KeyboardEvent;

      component.handleCardKey(event, video as any);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.modalOpen()).toBe(true);
      expect(component.selectedVideo()).toEqual(video);
    });

    it('opens the modal on Space and prevents default', async () => {
      (mockVideoApi.getAll as jest.Mock).mockReturnValue(of([]));
      (mockCollectionApi.getAll as jest.Mock).mockReturnValue(of([]));
      const { component } = await createComponent();
      const video = buildVideo();
      const event = { key: ' ', preventDefault: jest.fn() } as unknown as KeyboardEvent;

      component.handleCardKey(event, video as any);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.modalOpen()).toBe(true);
    });

    it('ignores other keys', async () => {
      (mockVideoApi.getAll as jest.Mock).mockReturnValue(of([]));
      (mockCollectionApi.getAll as jest.Mock).mockReturnValue(of([]));
      const { component } = await createComponent();
      const video = buildVideo();
      const event = { key: 'a', preventDefault: jest.fn() } as unknown as KeyboardEvent;

      component.handleCardKey(event, video as any);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(component.modalOpen()).toBe(false);
    });
  });

  describe('openDocs() / closeDocs()', () => {
    it('sets docDrawerVideo and stops propagation on openDocs', async () => {
      (mockVideoApi.getAll as jest.Mock).mockReturnValue(of([]));
      (mockCollectionApi.getAll as jest.Mock).mockReturnValue(of([]));
      const { component } = await createComponent();
      const video = buildVideo();
      const event = { stopPropagation: jest.fn() } as unknown as MouseEvent;

      component.openDocs(event, video as any);

      expect(event.stopPropagation).toHaveBeenCalled();
      expect(component.docDrawerVideo()).toEqual(video);
    });

    it('clears docDrawerVideo on closeDocs', async () => {
      (mockVideoApi.getAll as jest.Mock).mockReturnValue(of([]));
      (mockCollectionApi.getAll as jest.Mock).mockReturnValue(of([]));
      const { component } = await createComponent();
      component.docDrawerVideo.set(buildVideo() as any);

      component.closeDocs();

      expect(component.docDrawerVideo()).toBeNull();
    });
  });

  describe('safeEmbedUrl()', () => {
    it('builds a sanitized Vimeo embed url from the selected video', async () => {
      (mockVideoApi.getAll as jest.Mock).mockReturnValue(of([]));
      (mockCollectionApi.getAll as jest.Mock).mockReturnValue(of([]));
      const { component } = await createComponent();
      component.selectedVideo.set(buildVideo('v-1', { vimeoId: '987654321' }) as any);

      const url = component.safeEmbedUrl();

      expect(mockSanitizer.bypassSecurityTrustResourceUrl).toHaveBeenCalledWith(
        'https://player.vimeo.com/video/987654321',
      );
      expect(url).toBe('https://player.vimeo.com/video/987654321');
    });

    it('falls back to an empty vimeo id when no video is selected', async () => {
      (mockVideoApi.getAll as jest.Mock).mockReturnValue(of([]));
      (mockCollectionApi.getAll as jest.Mock).mockReturnValue(of([]));
      const { component } = await createComponent();

      const url = component.safeEmbedUrl();

      expect(url).toBe('https://player.vimeo.com/video/');
    });
  });

  describe('activeFilterLabel()', () => {
    it('returns null when no slug is selected', async () => {
      (mockVideoApi.getAll as jest.Mock).mockReturnValue(of([]));
      (mockCollectionApi.getAll as jest.Mock).mockReturnValue(of([]));
      const { component } = await createComponent();

      expect(component.activeFilterLabel()).toBeNull();
    });

    it('returns the collection name in the active language', async () => {
      (mockVideoApi.getAll as jest.Mock).mockReturnValue(of([]));
      (mockCollectionApi.getAll as jest.Mock).mockReturnValue(of([]));
      const { component } = await createComponent();
      component.collections.set([buildCollection('person-ali') as any]);
      component.selectedSlug.set('person-ali');

      expect(component.activeFilterLabel()).toBe('Ali');
    });

    it('returns null when the selected slug has no matching collection', async () => {
      (mockVideoApi.getAll as jest.Mock).mockReturnValue(of([]));
      (mockCollectionApi.getAll as jest.Mock).mockReturnValue(of([]));
      const { component } = await createComponent();
      component.collections.set([]);
      component.selectedSlug.set('ghost');

      expect(component.activeFilterLabel()).toBeNull();
    });
  });

  describe('emptyMessage()', () => {
    it('returns the search-empty message when a query is present', async () => {
      (mockVideoApi.getAll as jest.Mock).mockReturnValue(of([]));
      (mockCollectionApi.getAll as jest.Mock).mockReturnValue(of([]));
      const { component } = await createComponent();
      component.searchQuery.set('foo');

      expect(component.emptyMessage()).toBe('ARCHIVE.SEARCH_EMPTY');
      expect(mockI18n.t).toHaveBeenCalledWith('ARCHIVE.SEARCH_EMPTY', { q: 'foo' });
    });

    it('returns the empty-favorites message in favorites mode', async () => {
      (mockVideoApi.getAll as jest.Mock).mockReturnValue(of([]));
      (mockCollectionApi.getAll as jest.Mock).mockReturnValue(of([]));
      const { component } = await createComponent();
      component.showFavoritesOnly.set(true);

      expect(component.emptyMessage()).toBe('ARCHIVE.EMPTY_FAVORITES');
    });

    it('returns the generic empty message otherwise', async () => {
      (mockVideoApi.getAll as jest.Mock).mockReturnValue(of([]));
      (mockCollectionApi.getAll as jest.Mock).mockReturnValue(of([]));
      const { component } = await createComponent();

      expect(component.emptyMessage()).toBe('ARCHIVE.EMPTY');
    });
  });

  describe('language selection', () => {
    it('getTitle returns the title for the active language (de/en/fa)', async () => {
      (mockVideoApi.getAll as jest.Mock).mockReturnValue(of([]));
      (mockCollectionApi.getAll as jest.Mock).mockReturnValue(of([]));
      const { component } = await createComponent();
      const video = buildVideo('v-1', { title: { de: 'DeTitle', en: 'EnTitle', fa: 'FaTitle' } });

      mockI18n.lang.mockReturnValue('de');
      expect(component.getTitle(video as any)).toBe('DeTitle');
      mockI18n.lang.mockReturnValue('en');
      expect(component.getTitle(video as any)).toBe('EnTitle');
      mockI18n.lang.mockReturnValue('fa');
      expect(component.getTitle(video as any)).toBe('FaTitle');
    });

    it('getTitle returns an empty string for a null video', async () => {
      (mockVideoApi.getAll as jest.Mock).mockReturnValue(of([]));
      (mockCollectionApi.getAll as jest.Mock).mockReturnValue(of([]));
      const { component } = await createComponent();

      expect(component.getTitle(null)).toBe('');
    });

    it('getDescription returns the description for the active language', async () => {
      (mockVideoApi.getAll as jest.Mock).mockReturnValue(of([]));
      (mockCollectionApi.getAll as jest.Mock).mockReturnValue(of([]));
      const { component } = await createComponent();
      const video = buildVideo('v-1', { description: { de: 'DeDesc', en: 'EnDesc', fa: 'FaDesc' } });

      mockI18n.lang.mockReturnValue('en');
      expect(component.getDescription(video as any)).toBe('EnDesc');
      mockI18n.lang.mockReturnValue('fa');
      expect(component.getDescription(video as any)).toBe('FaDesc');
    });

    it('getDescription returns null when the video has no description', async () => {
      (mockVideoApi.getAll as jest.Mock).mockReturnValue(of([]));
      (mockCollectionApi.getAll as jest.Mock).mockReturnValue(of([]));
      const { component } = await createComponent();
      const video = buildVideo('v-1', { description: undefined });

      expect(component.getDescription(video as any)).toBeNull();
    });

    it('getCollectionName returns the name for the active language', async () => {
      (mockVideoApi.getAll as jest.Mock).mockReturnValue(of([]));
      (mockCollectionApi.getAll as jest.Mock).mockReturnValue(of([]));
      const { component } = await createComponent();
      const col = buildCollection('person-ali');

      mockI18n.lang.mockReturnValue('de');
      expect(component.getCollectionName(col as any)).toBe('Ali');
      mockI18n.lang.mockReturnValue('fa');
      expect(component.getCollectionName(col as any)).toBe('علی');
    });
  });

  describe('isFavorite()', () => {
    it('reflects the favorites store membership', async () => {
      (mockVideoApi.getAll as jest.Mock).mockReturnValue(of([]));
      (mockCollectionApi.getAll as jest.Mock).mockReturnValue(of([]));
      const { component } = await createComponent();
      favoritesStore.setIds(['v-1']);

      expect(component.isFavorite('v-1')).toBe(true);
      expect(component.isFavorite('v-2')).toBe(false);
    });
  });

  describe('search matching (via videos computed)', () => {
    it('matches on description text', async () => {
      const v1 = buildVideo('v-1', {
        title: { de: 'AAA', en: 'AAA', fa: 'AAA' },
        description: { de: 'RareDescriptionWord', en: 'RareDescriptionWord', fa: 'RareDescriptionWord' },
      });
      const v2 = buildVideo('v-2', {
        title: { de: 'BBB', en: 'BBB', fa: 'BBB' },
        description: { de: 'nothing', en: 'nothing', fa: 'nothing' },
      });
      (mockVideoApi.getAll as jest.Mock).mockReturnValue(of([v1, v2]));
      (mockCollectionApi.getAll as jest.Mock).mockReturnValue(of([]));
      const { component } = await createComponent();
      component.ngOnInit();

      component.searchQuery.set('raredescriptionword');

      expect(component.videos()).toHaveLength(1);
      expect(component.videos()[0].id).toBe('v-1');
    });

    it('matches on collection name', async () => {
      const v1 = buildVideo('v-1', {
        title: { de: 'AAA', en: 'AAA', fa: 'AAA' },
        collections: [
          { id: 'c-9', slug: 's-9', name: { de: 'UniqueCollectionName', en: 'UniqueCollectionName', fa: 'UniqueCollectionName' } },
        ],
      });
      const v2 = buildVideo('v-2', {
        title: { de: 'BBB', en: 'BBB', fa: 'BBB' },
        collections: [],
      });
      (mockVideoApi.getAll as jest.Mock).mockReturnValue(of([v1, v2]));
      (mockCollectionApi.getAll as jest.Mock).mockReturnValue(of([]));
      const { component } = await createComponent();
      component.ngOnInit();

      component.searchQuery.set('uniquecollectionname');

      expect(component.videos()).toHaveLength(1);
      expect(component.videos()[0].id).toBe('v-1');
    });

    it('matches on document title', async () => {
      const v1 = buildVideo('v-1', {
        title: { de: 'AAA', en: 'AAA', fa: 'AAA' },
        documents: [{ id: 'd-1', title: 'SecretDocumentTitle' }],
      });
      const v2 = buildVideo('v-2', {
        title: { de: 'BBB', en: 'BBB', fa: 'BBB' },
        documents: [],
      });
      (mockVideoApi.getAll as jest.Mock).mockReturnValue(of([v1, v2]));
      (mockCollectionApi.getAll as jest.Mock).mockReturnValue(of([]));
      const { component } = await createComponent();
      component.ngOnInit();

      component.searchQuery.set('secretdocumenttitle');

      expect(component.videos()).toHaveLength(1);
      expect(component.videos()[0].id).toBe('v-1');
    });
  });

  describe('loadThumbnails()', () => {
    it('populates the thumbnails signal when getThumbnail returns a url', async () => {
      (mockVideoApi.getAll as jest.Mock).mockReturnValue(of([buildVideo('v-1', { vimeoId: '111222333' })]));
      (mockCollectionApi.getAll as jest.Mock).mockReturnValue(of([]));
      (mockVideoApi.getThumbnail as jest.Mock).mockReturnValue(of('https://thumb.example/x.jpg'));
      const { component } = await createComponent();
      component.ngOnInit();

      expect(component.thumbnails()['111222333']).toBe('https://thumb.example/x.jpg');
    });
  });
});
