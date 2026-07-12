import { IVideoTranslation } from './video.interface';

export type CollectionType = 'PERSON' | 'TOPIC';

export interface ICollectionSummary {
  id: string;
  slug: string;
  type: CollectionType;
  name: IVideoTranslation;
}

export interface ICollection extends ICollectionSummary {
  description: IVideoTranslation | null;
  sortOrder: number;
  videoCount: number;
  createdAt: Date;
  updatedAt: Date;
}
