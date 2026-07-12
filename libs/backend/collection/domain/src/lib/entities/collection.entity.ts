import { IVideoTranslation } from '@iranianoralhistory/shared-contracts';
import { CollectionType } from '@iranianoralhistory/shared-contracts';

export class CollectionEntity {
  constructor(
    public readonly id: string,
    public readonly slug: string,
    public readonly type: CollectionType,
    public readonly name: IVideoTranslation,
    public readonly description: IVideoTranslation | null,
    public readonly sortOrder: number,
    public readonly videoCount: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  getName(lang: 'de' | 'en' | 'fa'): string {
    return this.name[lang];
  }

  getDescription(lang: 'de' | 'en' | 'fa'): string | null {
    return this.description?.[lang] ?? null;
  }
}
