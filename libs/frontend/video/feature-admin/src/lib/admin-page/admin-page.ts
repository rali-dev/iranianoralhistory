import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import {
  VideoApiService,
  CollectionApiService,
} from '@iranianoralhistory/frontend-video-data-access';
import { IVideo, ICollection, IDocument, IVideoCollectionRef } from '@iranianoralhistory/shared-contracts';
import { I18nService } from '@iranianoralhistory/frontend-shared-i18n';
import { createDeleteConfirmState } from '@iranianoralhistory/frontend-shared-utils';
import { VideoCreateFormComponent } from '../video-create-form/video-create-form';
import { DocumentAddFormComponent } from '../document-add-form/document-add-form';
import { CollectionCreateFormComponent } from '../collection-create-form/collection-create-form';
import { CategoryCreateFormComponent } from '../category-create-form/category-create-form';

type AdminTab = 'videos' | 'collections' | 'categories';

interface VideoEditState {
  titleDe: string;
  titleEn: string;
  titleFa: string;
  descDe: string;
  descEn: string;
  descFa: string;
  vimeoId: string;
}

interface CollectionEditState {
  nameDe: string;
  nameEn: string;
  nameFa: string;
  descDe: string;
  descEn: string;
  descFa: string;
  slug: string;
  sortOrder: number;
}

@Component({
  selector: 'lib-admin-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    VideoCreateFormComponent,
    DocumentAddFormComponent,
    CollectionCreateFormComponent,
    CategoryCreateFormComponent,
  ],
  templateUrl: './admin-page.html',
  styleUrl: './admin-page.css',
})
export class AdminPageComponent implements OnInit {
  private readonly videoApi = inject(VideoApiService);
  private readonly collectionApi = inject(CollectionApiService);
  readonly i18n = inject(I18nService);

  activeTab = signal<AdminTab>('videos');

  videos = signal<IVideo[]>([]);
  videosLoading = signal(false);
  expandedVideoId = signal<string | null>(null);

  collections = signal<ICollection[]>([]);
  collectionsLoading = signal(false);

  readonly persons = computed(() => this.collections().filter((c) => c.type === 'PERSON'));
  readonly topics = computed(() => this.collections().filter((c) => c.type === 'TOPIC'));

  // Edit state
  editingVideoId = signal<string | null>(null);
  editingVideoState = signal<VideoEditState | null>(null);
  savingVideoId = signal<string | null>(null);

  editingCollectionId = signal<string | null>(null);
  editingCollectionState = signal<CollectionEditState | null>(null);
  savingCollectionId = signal<string | null>(null);

  // Video ↔ Collection/Category assignment (only one video panel is open at a time)
  assignTargetId = signal<string>('');
  assigningVideoId = signal<string | null>(null);

  // Delete confirm state — replaces 6 separate signals
  readonly videoDelete = createDeleteConfirmState();
  readonly collectionDelete = createDeleteConfirmState();
  readonly docDelete = createDeleteConfirmState();

  statusMsg = signal<string | null>(null);
  errorMsg = signal<string | null>(null);

  ngOnInit(): void {
    this.loadVideos();
    this.loadCollections();
  }

  setTab(tab: AdminTab): void {
    this.activeTab.set(tab);
  }

  loadVideos(): void {
    this.videosLoading.set(true);
    this.videoApi.getAll().subscribe({
      next: (videos) => {
        this.videos.set(videos);
        this.videosLoading.set(false);
      },
      error: () => this.videosLoading.set(false),
    });
  }

  loadCollections(): void {
    this.collectionsLoading.set(true);
    this.collectionApi.getAll().subscribe({
      next: (cols) => {
        this.collections.set(cols);
        this.collectionsLoading.set(false);
      },
      error: () => this.collectionsLoading.set(false),
    });
  }

  onVideoCreated(video: IVideo): void {
    this.videos.update((list) => [video, ...list]);
  }

  onCollectionCreated(collection: ICollection): void {
    this.collections.update((list) => [collection, ...list]);
  }

  onCategoryCreated(category: ICollection): void {
    this.collections.update((list) => [category, ...list]);
  }

  toggleDocuments(videoId: string): void {
    this.expandedVideoId.update((id) => (id === videoId ? null : videoId));
  }

  // ── Document Add ──────────────────────────────────────────────────────────────

  /** Merge a freshly created document into its video so the badge count and the
   *  document list update live — without a page reload. Mirrors confirmDeleteDoc(). */
  onDocumentAdded(videoId: string, doc: IDocument): void {
    this.videos.update((list) =>
      list.map((v) =>
        v.id === videoId ? { ...v, documents: [...v.documents, doc] } : v,
      ),
    );
  }

  // ── Video ↔ Collection / Category ─────────────────────────────────────────────

  /** Collections/categories not yet linked to this video — the assignable options. */
  availableCollections(video: IVideo): ICollection[] {
    const assigned = new Set(video.collections.map((c) => c.id));
    return this.collections().filter((c) => !assigned.has(c.id));
  }

  /** Link the selected collection/category to the video; update the list live. */
  assignCollection(videoId: string): void {
    const collectionId = this.assignTargetId();
    const col = this.collections().find((c) => c.id === collectionId);
    if (!col) return;

    this.assigningVideoId.set(videoId);
    this.collectionApi.assignVideo(collectionId, videoId).subscribe({
      next: () => {
        const ref: IVideoCollectionRef = { id: col.id, slug: col.slug, type: col.type, name: col.name };
        this.videos.update((list) =>
          list.map((v) =>
            v.id === videoId && !v.collections.some((c) => c.id === ref.id)
              ? { ...v, collections: [...v.collections, ref] }
              : v,
          ),
        );
        // keep the collection's "X films" badge in sync live
        this.collections.update((cols) =>
          cols.map((c) => (c.id === collectionId ? { ...c, videoCount: c.videoCount + 1 } : c)),
        );
        this.assignTargetId.set('');
        this.assigningVideoId.set(null);
        this.showStatus('ADMIN.ASSIGN_OK', {});
      },
      error: () => {
        this.assigningVideoId.set(null);
        this.showError('ADMIN.ERR_UPDATE');
      },
    });
  }

  /** Unlink a collection/category from the video; update the list live. */
  unassignCollection(videoId: string, collectionId: string): void {
    this.collectionApi.unassignVideo(collectionId, videoId).subscribe({
      next: () => {
        this.videos.update((list) =>
          list.map((v) =>
            v.id === videoId
              ? { ...v, collections: v.collections.filter((c) => c.id !== collectionId) }
              : v,
          ),
        );
        // keep the collection's "X films" badge in sync live
        this.collections.update((cols) =>
          cols.map((c) => (c.id === collectionId ? { ...c, videoCount: Math.max(0, c.videoCount - 1) } : c)),
        );
        this.showStatus('ADMIN.ASSIGN_OK', {});
      },
      error: () => this.showError('ADMIN.ERR_UPDATE'),
    });
  }

  // ── Video Edit ────────────────────────────────────────────────────────────────

  startEditVideo(video: IVideo): void {
    this.editingVideoId.set(video.id);
    this.editingVideoState.set({
      titleDe: video.title.de,
      titleEn: video.title.en,
      titleFa: video.title.fa,
      descDe: video.description?.de ?? '',
      descEn: video.description?.en ?? '',
      descFa: video.description?.fa ?? '',
      vimeoId: video.vimeoId,
    });
  }

  cancelEditVideo(): void {
    this.editingVideoId.set(null);
    this.editingVideoState.set(null);
  }

  saveEditVideo(videoId: string): void {
    const state = this.editingVideoState();
    if (!state) return;

    this.savingVideoId.set(videoId);
    const hasDesc = state.descDe.trim() || state.descEn.trim() || state.descFa.trim();

    this.videoApi.update(videoId, {
      vimeoId: state.vimeoId,
      title: { de: state.titleDe, en: state.titleEn, fa: state.titleFa },
      description: hasDesc
        ? { de: state.descDe, en: state.descEn, fa: state.descFa }
        : null,
    }).subscribe({
      next: (updated) => {
        this.videos.update((list) => list.map((v) => (v.id === updated.id ? updated : v)));
        this.editingVideoId.set(null);
        this.editingVideoState.set(null);
        this.savingVideoId.set(null);
        this.showStatus('ADMIN.VIDEO.SAVED', { id: videoId.slice(0, 8) });
      },
      error: (err: HttpErrorResponse) => {
        this.savingVideoId.set(null);
        this.showError(
          this.updateErrorKey(err, 'ADMIN.VIDEO.ERR_DUPLICATE', 'ADMIN.VIDEO.ERR_INVALID_VIMEO'),
        );
      },
    });
  }

  // ── Video Delete ──────────────────────────────────────────────────────────────

  confirmDeleteVideo(videoId: string): void {
    this.videoDelete.begin(videoId);
    this.videoApi.delete(videoId).subscribe({
      next: () => {
        this.videos.update((list) => list.filter((v) => v.id !== videoId));
        this.videoDelete.done();
        if (this.expandedVideoId() === videoId) this.expandedVideoId.set(null);
        this.showStatus('ADMIN.DELETE_VIDEO_OK', {});
      },
      error: () => {
        this.videoDelete.done();
        this.showError('ADMIN.ERR_DELETE');
      },
    });
  }

  // ── Document Delete ───────────────────────────────────────────────────────────

  confirmDeleteDoc(videoId: string, docId: string): void {
    this.docDelete.begin(docId);
    this.videoApi.deleteDocument(videoId, docId).subscribe({
      next: () => {
        this.videos.update((list) =>
          list.map((v) =>
            v.id === videoId
              ? { ...v, documents: v.documents.filter((d) => d.id !== docId) }
              : v
          )
        );
        this.docDelete.done();
        this.showStatus('ADMIN.DELETE_DOC_OK', {});
      },
      error: () => {
        this.docDelete.done();
        this.showError('ADMIN.ERR_DELETE');
      },
    });
  }

  // ── Collection / Category Edit ────────────────────────────────────────────────

  startEditCollection(col: ICollection): void {
    this.editingCollectionId.set(col.id);
    this.editingCollectionState.set({
      nameDe: col.name.de,
      nameEn: col.name.en,
      nameFa: col.name.fa,
      descDe: col.description?.de ?? '',
      descEn: col.description?.en ?? '',
      descFa: col.description?.fa ?? '',
      slug: col.slug,
      sortOrder: col.sortOrder ?? 0,
    });
  }

  cancelEditCollection(): void {
    this.editingCollectionId.set(null);
    this.editingCollectionState.set(null);
  }

  saveEditCollection(colId: string, isCategory: boolean): void {
    const state = this.editingCollectionState();
    if (!state) return;

    this.savingCollectionId.set(colId);
    const hasDesc = state.descDe.trim() || state.descEn.trim() || state.descFa.trim();

    this.collectionApi.update(colId, {
      slug: state.slug,
      name: { de: state.nameDe, en: state.nameEn, fa: state.nameFa },
      description: hasDesc
        ? { de: state.descDe, en: state.descEn, fa: state.descFa }
        : null,
      sortOrder: state.sortOrder,
    }).subscribe({
      next: (updated) => {
        this.collections.update((list) => list.map((c) => (c.id === updated.id ? updated : c)));
        this.editingCollectionId.set(null);
        this.editingCollectionState.set(null);
        this.savingCollectionId.set(null);
        this.showStatus(isCategory ? 'ADMIN.CAT.SAVED' : 'ADMIN.COL.SAVED', { name: state.nameDe });
      },
      error: (err: HttpErrorResponse) => {
        this.savingCollectionId.set(null);
        this.showError(
          this.updateErrorKey(err, isCategory ? 'ADMIN.CAT.ERR_DUPLICATE_SLUG' : 'ADMIN.COL.ERR_DUPLICATE_SLUG'),
        );
      },
    });
  }

  // ── Collection / Category Delete ──────────────────────────────────────────────

  confirmDeleteCollection(colId: string, isCategory: boolean): void {
    this.collectionDelete.begin(colId);
    this.collectionApi.delete(colId).subscribe({
      next: () => {
        this.collections.update((list) => list.filter((c) => c.id !== colId));
        this.collectionDelete.done();
        this.showStatus(isCategory ? 'ADMIN.DELETE_CAT_OK' : 'ADMIN.DELETE_COL_OK', {});
      },
      error: () => {
        this.collectionDelete.done();
        this.showError('ADMIN.ERR_DELETE');
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────

  private showStatus(key: string, params: Record<string, string | number>): void {
    this.errorMsg.set(null);
    this.statusMsg.set(this.i18n.t(key, params));
    setTimeout(() => this.statusMsg.set(null), 3000);
  }

  private showError(key: string): void {
    this.statusMsg.set(null);
    this.errorMsg.set(this.i18n.t(key));
    setTimeout(() => this.errorMsg.set(null), 4000);
  }

  /**
   * Maps a failed save to a specific, localized message: 409 → a "already in use"
   * conflict, 400 → an invalid-input hint, everything else → the generic fallback.
   * Branching on the HTTP status (not the raw backend string) keeps all locales honored.
   */
  private updateErrorKey(err: HttpErrorResponse, conflictKey: string, badRequestKey?: string): string {
    if (err?.status === 409) return conflictKey;
    if (err?.status === 400 && badRequestKey) return badRequestKey;
    return 'ADMIN.ERR_UPDATE';
  }
}
