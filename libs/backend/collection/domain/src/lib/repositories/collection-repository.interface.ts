import { IVideoTranslation } from '@iranianoralhistory/shared-contracts';
import { CollectionType } from '@iranianoralhistory/shared-contracts';
import { CollectionEntity } from '../entities/collection.entity';

export interface CreateCollectionInput {
  slug: string;
  type: CollectionType;
  name: IVideoTranslation;
  description: IVideoTranslation | null;
  sortOrder: number;
}

export interface UpdateCollectionInput {
  slug?: string;
  name?: Partial<IVideoTranslation>;
  description?: Partial<IVideoTranslation> | null;
  sortOrder?: number;
}

export interface ICollectionRepository {
  findAll(): Promise<CollectionEntity[]>;
  findBySlug(slug: string): Promise<CollectionEntity | null>;
  findByType(type: CollectionType): Promise<CollectionEntity[]>;
  create(data: CreateCollectionInput): Promise<CollectionEntity>;
  update(id: string, data: UpdateCollectionInput): Promise<CollectionEntity>;
  delete(id: string): Promise<void>;
  assignVideo(videoId: string, collectionId: string): Promise<void>;
  removeVideo(videoId: string, collectionId: string): Promise<void>;
}

export const COLLECTION_REPOSITORY = Symbol('COLLECTION_REPOSITORY');
