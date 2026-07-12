import { IVideoTranslation, IVideoCollectionRef } from '@iranianoralhistory/shared-contracts';
import { DocumentEntity } from './document.entity';
import { VimeoId } from '../value-objects/vimeo-id.value-object';

export class VideoEntity {
  constructor(
    public readonly id: string,
    public readonly vimeoId: VimeoId,
    public readonly title: IVideoTranslation,
    public readonly description: IVideoTranslation | null,
    public readonly documents: DocumentEntity[],
    public readonly collections: IVideoCollectionRef[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  getTitle(lang: 'de' | 'en' | 'fa'): string {
    return this.title[lang];
  }

  getDescription(lang: 'de' | 'en' | 'fa'): string | null {
    return this.description?.[lang] ?? null;
  }

  isRtl(lang: 'de' | 'en' | 'fa'): boolean {
    return lang === 'fa';
  }
}
