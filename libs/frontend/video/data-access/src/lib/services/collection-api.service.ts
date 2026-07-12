import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ICollection, CreateCollectionDto, UpdateCollectionDto } from '@iranianoralhistory/shared-contracts';

@Injectable({ providedIn: 'root' })
export class CollectionApiService {
  private readonly base = '/api/collections';

  private readonly http = inject(HttpClient);

  getAll(): Observable<ICollection[]> {
    return this.http.get<ICollection[]>(this.base);
  }

  create(dto: CreateCollectionDto): Observable<ICollection> {
    return this.http.post<ICollection>(this.base, dto);
  }

  update(id: string, dto: UpdateCollectionDto): Observable<ICollection> {
    return this.http.patch<ICollection>(`${this.base}/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  assignVideo(collectionId: string, videoId: string): Observable<void> {
    return this.http.post<void>(`${this.base}/${collectionId}/videos/${videoId}`, {});
  }

  unassignVideo(collectionId: string, videoId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${collectionId}/videos/${videoId}`);
  }
}
