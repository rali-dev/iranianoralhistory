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
});
