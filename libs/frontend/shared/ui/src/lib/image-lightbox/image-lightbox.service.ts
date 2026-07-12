import { Injectable, computed, signal } from '@angular/core';

export interface LightboxImage {
  src:     string;
  caption: string;
  alt:     string;
}

@Injectable({ providedIn: 'root' })
export class ImageLightboxService {
  private readonly _image = signal<LightboxImage | null>(null);

  readonly image  = this._image.asReadonly();
  readonly isOpen = computed(() => this._image() !== null);

  open(src: string, caption: string, alt = caption): void {
    this._image.set({ src, caption, alt });
  }

  close(): void {
    this._image.set(null);
  }
}
