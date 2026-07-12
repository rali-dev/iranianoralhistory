export interface IVideoTranslation {
  de: string;
  en: string;
  fa: string;
}

export interface IDocument {
  id: string;
  title: string;
  storagePath: string;
  videoId: string;
  createdAt: Date;
}

export interface IVideo {
  id: string;
  vimeoId: string;
  title: IVideoTranslation;
  description: IVideoTranslation | null;
  documents: IDocument[];
  collections: IVideoCollectionRef[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IVideoCollectionRef {
  id: string;
  slug: string;
  type: string;
  name: IVideoTranslation;
}
