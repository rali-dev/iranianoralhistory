import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FavoriteApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api';

  getFavoriteVideoIds(): Observable<string[]> {
    return this.http.get<string[]>(`${this.base}/users/me/favorites`);
  }

  addFavorite(videoId: string): Observable<void> {
    return this.http.post<void>(`${this.base}/videos/${videoId}/favorite`, {});
  }

  removeFavorite(videoId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/videos/${videoId}/favorite`);
  }
}
