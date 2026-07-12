import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
  IVideo,
  IDocument,
  CreateVideoDto,
  UpdateVideoDto,
  CreateDocumentDto,
  UpdateDocumentDto,
} from '@iranianoralhistory/shared-contracts';

interface OEmbedResponse {
  thumbnail_url: string;
}

@Injectable({ providedIn: 'root' })
export class VideoApiService {
  private readonly base = '/api/videos';
  private readonly thumbnailCache = new Map<string, string>();

  private readonly http = inject(HttpClient);

  getAll(): Observable<IVideo[]> {
    return this.http.get<IVideo[]>(this.base);
  }

  getById(id: string): Observable<IVideo> {
    return this.http.get<IVideo>(`${this.base}/${id}`);
  }

  create(dto: CreateVideoDto): Observable<IVideo> {
    return this.http.post<IVideo>(this.base, dto);
  }

  update(id: string, dto: UpdateVideoDto): Observable<IVideo> {
    return this.http.patch<IVideo>(`${this.base}/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  addDocument(videoId: string, dto: CreateDocumentDto): Observable<IDocument> {
    return this.http.post<IDocument>(`${this.base}/${videoId}/documents`, dto);
  }

  updateDocument(videoId: string, docId: string, dto: UpdateDocumentDto): Observable<IDocument> {
    return this.http.patch<IDocument>(`${this.base}/${videoId}/documents/${docId}`, dto);
  }

  deleteDocument(videoId: string, docId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${videoId}/documents/${docId}`);
  }

  getThumbnail(vimeoId: string): Observable<string | null> {
    const cached = this.thumbnailCache.get(vimeoId);
    if (cached) return of(cached);

    return this.http
      .get<OEmbedResponse>(
        `https://vimeo.com/api/oembed.json?url=https://vimeo.com/${vimeoId}&width=640`,
      )
      .pipe(
        map((res) => {
          this.thumbnailCache.set(vimeoId, res.thumbnail_url);
          return res.thumbnail_url;
        }),
        catchError(() => of(null)),
      );
  }
}
