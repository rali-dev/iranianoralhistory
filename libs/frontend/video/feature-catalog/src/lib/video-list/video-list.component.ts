import { Component, OnInit, signal, computed, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  VideoApiService,
  CollectionApiService,
  FavoriteApiService,
  favoritesStore,
} from '@iranianoralhistory/frontend-video-data-access';
import { authStore } from '@iranianoralhistory/frontend-identity-data-access';
import { I18nService } from '@iranianoralhistory/frontend-shared-i18n';
import { IVideo, ICollection, IVideoCollectionRef } from '@iranianoralhistory/shared-contracts';

@Component({
  selector: 'lib-video-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './video-list.component.html',
})
export class VideoListComponent implements OnInit {
  private readonly videoApi      = inject(VideoApiService);
  private readonly collectionApi = inject(CollectionApiService);
  private readonly favoriteApi   = inject(FavoriteApiService);
  private readonly sanitizer     = inject(DomSanitizer);
  private readonly route         = inject(ActivatedRoute);
  readonly i18n                  = inject(I18nService);

  private allVideos     = signal<IVideo[]>([]);

  collections           = signal<ICollection[]>([]);
  selectedSlug          = signal<string | null>(null);
  showFavoritesOnly     = signal(false);
  isListView            = signal(false);
  isLoading             = signal(false);
  collectionsLoading    = signal(false);
  filterOpen            = signal(false);
  collectionPanel       = signal<'main' | 'type-select' | 'persons' | 'topics'>('main');
  selectedVideo         = signal<IVideo | null>(null);
  apiError              = signal<string | null>(null);
  thumbnails            = signal<Record<string, string>>({});
  searchQuery           = signal('');

  readonly authStore      = authStore;
  readonly favoritesStore = favoritesStore;

  hasActiveFilter    = computed(() => this.selectedSlug() !== null || this.showFavoritesOnly());
  personCollections  = computed(() => this.collections().filter(c => c.type === 'PERSON'));
  topicCollections   = computed(() => this.collections().filter(c => c.type === 'TOPIC'));
  activeFilterLabel  = computed((): string | null => {
    const slug = this.selectedSlug();
    if (!slug) return null;
    const col = this.collections().find(c => c.slug === slug);
    return col ? col.name[this.i18n.lang()] : null;
  });

  videos = computed(() => {
    const all = this.allVideos();

    let filtered: IVideo[];
    if (this.showFavoritesOnly()) {
      filtered = all.filter(v => favoritesStore.ids().has(v.id));
    } else {
      const slug = this.selectedSlug();
      filtered = slug ? all.filter(v => v.collections.some(c => c.slug === slug)) : all;
    }

    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return filtered;
    return filtered.filter(v => this.matchesSearch(v, q));
  });

  docDrawerVideo = signal<IVideo | null>(null);
  modalOpen = signal(false);

  ngOnInit(): void {
    this.isLoading.set(true);
    this.videoApi.getAll().subscribe({
      next: (videos) => {
        this.allVideos.set(videos);
        this.isLoading.set(false);
        this.loadThumbnails(videos);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.apiError.set(`HTTP ${err.status}: ${err.message ?? err.statusText}`);
      },
    });
    this.collectionsLoading.set(true);
    this.collectionApi.getAll().subscribe({
      next: (cols) => {
        this.collections.set(cols);
        this.collectionsLoading.set(false);
      },
      error: () => this.collectionsLoading.set(false),
    });
    this.route.queryParams.subscribe((params) => {
      if (params['favorites'] === 'true') {
        this.showFavoritesOnly.set(true);
        this.selectedSlug.set(null);
        this.isListView.set(true);
      }
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!(event.target as HTMLElement).closest('.filter-dropdown')) {
      this.filterOpen.set(false);
      this.collectionPanel.set('main');
    }
  }

  toggleFilter(event: MouseEvent): void {
    event.stopPropagation();
    const isOpening = !this.filterOpen();
    this.filterOpen.update((v) => !v);
    if (!isOpening) {
      this.collectionPanel.set('main');
    }
  }

  selectCollection(slug: string | null): void {
    this.showFavoritesOnly.set(false);
    this.isListView.set(false);
    this.selectedSlug.set(slug === this.selectedSlug() ? null : slug);
    this.filterOpen.set(false);
    this.collectionPanel.set('main');
  }

  selectFavoritesFilter(): void {
    if (this.showFavoritesOnly()) {
      this.showFavoritesOnly.set(false);
      this.isListView.set(false);
    } else {
      this.showFavoritesOnly.set(true);
      this.selectedSlug.set(null);
      this.isListView.set(true);
    }
    this.filterOpen.set(false);
    this.collectionPanel.set('main');
  }

  openCollections(): void { this.collectionPanel.set('type-select'); }
  openPersons(): void     { this.collectionPanel.set('persons'); }
  openTopics(): void      { this.collectionPanel.set('topics'); }
  goBackToMain(): void    { this.collectionPanel.set('main'); }
  goBackToTypeSelect(): void { this.collectionPanel.set('type-select'); }

  isFavorite(videoId: string): boolean {
    return favoritesStore.ids().has(videoId);
  }

  toggleFavorite(event: MouseEvent, videoId: string): void {
    event.stopPropagation();
    if (!authStore.isAuthenticated()) return;

    if (favoritesStore.ids().has(videoId)) {
      favoritesStore.remove(videoId);
      this.favoriteApi.removeFavorite(videoId).subscribe({
        error: () => favoritesStore.add(videoId),
      });
    } else {
      favoritesStore.add(videoId);
      this.favoriteApi.addFavorite(videoId).subscribe({
        error: () => favoritesStore.remove(videoId),
      });
    }
  }

  private loadThumbnails(videos: IVideo[]): void {
    videos.forEach((v) => {
      this.videoApi.getThumbnail(v.vimeoId).subscribe({
        next: (url) => {
          if (url) this.thumbnails.update((t) => ({ ...t, [v.vimeoId]: url }));
        },
      });
    });
  }

  openModal(video: IVideo): void {
    this.selectedVideo.set(video);
    this.modalOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.selectedVideo.set(null);
    document.body.style.overflow = '';
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => { /* no-op */ });
    }
  }

  openDocs(event: MouseEvent, video: IVideo): void {
    event.stopPropagation();
    this.docDrawerVideo.set(video);
  }

  closeDocs(): void {
    this.docDrawerVideo.set(null);
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.modalOpen()) {
      this.closeModal();
    } else if (this.docDrawerVideo()) {
      this.closeDocs();
    }
  }

  handleCardKey(event: KeyboardEvent, video: IVideo): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.openModal(video);
    }
  }

  safeEmbedUrl(): SafeResourceUrl {
    const vimeoId = this.selectedVideo()?.vimeoId ?? '';
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://player.vimeo.com/video/${vimeoId}`,
    );
  }

  getTitle(video: IVideo | null = null): string {
    return video?.title[this.i18n.lang()] ?? '';
  }

  getDescription(video: IVideo | null = null): string | null {
    return video?.description?.[this.i18n.lang()] ?? null;
  }

  getCollectionName(col: ICollection | IVideoCollectionRef): string {
    return col.name[this.i18n.lang()];
  }

  isRtl(): boolean {
    return this.i18n.isRtl();
  }

  videoCount(): string {
    const n = this.videos().length;
    return n === 1
      ? this.i18n.t('ARCHIVE.COUNT_ONE', { n })
      : this.i18n.t('ARCHIVE.COUNT_MANY', { n });
  }

  docCount(count: number): string {
    return `${count} ${this.i18n.t('ARCHIVE.DOC_SHORT')}`;
  }

  onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  emptyMessage(): string {
    const q = this.searchQuery().trim();
    if (q) return this.i18n.t('ARCHIVE.SEARCH_EMPTY', { q });
    if (this.showFavoritesOnly()) return this.i18n.t('ARCHIVE.EMPTY_FAVORITES');
    return this.i18n.t('ARCHIVE.EMPTY');
  }

  private matchesSearch(v: IVideo, q: string): boolean {
    const has = (s: string | null | undefined): boolean => !!s?.toLowerCase().includes(q);
    return (
      has(v.title.de) || has(v.title.en) || has(v.title.fa) ||
      has(v.description?.de) || has(v.description?.en) || has(v.description?.fa) ||
      v.collections.some(c => has(c.name.de) || has(c.name.en) || has(c.name.fa)) ||
      v.documents.some(d => has(d.title))
    );
  }
}
