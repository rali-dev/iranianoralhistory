import { IVideoTranslation } from '@iranianoralhistory/shared-contracts';
import { VideoEntity } from '../entities/video.entity';
import { DocumentEntity } from '../entities/document.entity';
import { VimeoId } from '../value-objects/vimeo-id.value-object';

export interface CreateVideoInput {
  vimeoId: VimeoId;
  title: IVideoTranslation;
  description: IVideoTranslation | null;
}

export interface UpdateVideoInput {
  vimeoId?: string;
  title?: Partial<IVideoTranslation>;
  description?: Partial<IVideoTranslation> | null;
}

export interface CreateDocumentInput {
  title: string;
  storagePath: string;
  videoId: string;
}

export interface UpdateDocumentInput {
  title?: string;
  storagePath?: string;
}

export interface IVideoRepository {
  findAll(): Promise<VideoEntity[]>;
  findById(id: string): Promise<VideoEntity | null>;
  findDocumentById(docId: string): Promise<DocumentEntity | null>;
  create(data: CreateVideoInput): Promise<VideoEntity>;
  update(id: string, data: UpdateVideoInput): Promise<VideoEntity>;
  delete(id: string): Promise<void>;
  addDocument(data: CreateDocumentInput): Promise<DocumentEntity>;
  updateDocument(docId: string, data: UpdateDocumentInput): Promise<DocumentEntity>;
  deleteDocument(docId: string): Promise<void>;
}

export const VIDEO_REPOSITORY = Symbol('VIDEO_REPOSITORY');
