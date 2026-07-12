import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '@iranianoralhistory/backend-shared-database';
import {
  VideoEntity,
  DocumentEntity,
  VimeoId,
} from '@iranianoralhistory/backend-video-domain';
import { PrismaVideoRepository } from './prisma-video.repository';

type VideoDelegate = {
  findMany: jest.Mock;
  findUnique: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
};

type DocumentDelegate = {
  findUnique: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
};

const VIDEO_INCLUDE = {
  documents: true,
  collections: { include: { collection: true } },
};

function buildVideoRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'video-uuid-1',
    vimeoId: '123456789',
    titleDe: 'Deutscher Titel',
    titleEn: 'English Title',
    titleFa: 'عنوان فارسی',
    descDe: 'Deutsche Beschreibung',
    descEn: 'English Description',
    descFa: 'توضیحات فارسی',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-02T00:00:00.000Z'),
    documents: [
      {
        id: 'doc-uuid-1',
        title: 'Transcript',
        storagePath: '/docs/transcript.pdf',
        videoId: 'video-uuid-1',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
      },
    ],
    collections: [
      {
        collection: {
          id: 'coll-uuid-1',
          slug: 'person-slug',
          type: 'PERSON',
          nameDe: 'Name DE',
          nameEn: 'Name EN',
          nameFa: 'Name FA',
        },
      },
    ],
    ...overrides,
  };
}

function buildDocRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'doc-uuid-1',
    title: 'Transcript',
    storagePath: '/docs/transcript.pdf',
    videoId: 'video-uuid-1',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('PrismaVideoRepository', () => {
  let video: VideoDelegate;
  let document: DocumentDelegate;
  let repo: PrismaVideoRepository;

  beforeEach(() => {
    video = {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    document = {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    const prisma = { video, document } as unknown as PrismaService;
    repo = new PrismaVideoRepository(prisma);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('lists videos ordered by createdAt desc and maps them to entities', async () => {
      video.findMany.mockResolvedValue([buildVideoRow()]);

      const result = await repo.findAll();

      expect(video.findMany).toHaveBeenCalledWith({
        include: VIDEO_INCLUDE,
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(VideoEntity);
      expect(result[0].id).toBe('video-uuid-1');
      expect(result[0].vimeoId.toString()).toBe('123456789');
      expect(result[0].title).toEqual({ de: 'Deutscher Titel', en: 'English Title', fa: 'عنوان فارسی' });
      expect(result[0].documents[0]).toBeInstanceOf(DocumentEntity);
      expect(result[0].collections[0]).toEqual({
        id: 'coll-uuid-1',
        slug: 'person-slug',
        type: 'PERSON',
        name: { de: 'Name DE', en: 'Name EN', fa: 'Name FA' },
      });
    });
  });

  describe('findById', () => {
    it('queries by id and maps the row to a VideoEntity', async () => {
      video.findUnique.mockResolvedValue(buildVideoRow());

      const result = await repo.findById('video-uuid-1');

      expect(video.findUnique).toHaveBeenCalledWith({
        where: { id: 'video-uuid-1' },
        include: VIDEO_INCLUDE,
      });
      expect(result).toBeInstanceOf(VideoEntity);
      expect(result?.description).toEqual({
        de: 'Deutsche Beschreibung',
        en: 'English Description',
        fa: 'توضیحات فارسی',
      });
    });

    it('returns null when no row is found', async () => {
      video.findUnique.mockResolvedValue(null);

      const result = await repo.findById('missing');

      expect(result).toBeNull();
    });

    it('maps a null description when descDe is null', async () => {
      video.findUnique.mockResolvedValue(buildVideoRow({ descDe: null, descEn: null, descFa: null }));

      const result = await repo.findById('video-uuid-1');

      expect(result?.description).toBeNull();
    });
  });

  describe('create', () => {
    it('creates a video from CreateVideoInput and maps the row', async () => {
      video.create.mockResolvedValue(buildVideoRow());

      const result = await repo.create({
        vimeoId: VimeoId.create('123456789'),
        title: { de: 'Deutscher Titel', en: 'English Title', fa: 'عنوان فارسی' },
        description: { de: 'Deutsche Beschreibung', en: 'English Description', fa: 'توضیحات فارسی' },
      });

      expect(video.create).toHaveBeenCalledWith({
        data: {
          vimeoId: '123456789',
          titleDe: 'Deutscher Titel',
          titleEn: 'English Title',
          titleFa: 'عنوان فارسی',
          descDe: 'Deutsche Beschreibung',
          descEn: 'English Description',
          descFa: 'توضیحات فارسی',
        },
        include: VIDEO_INCLUDE,
      });
      expect(result).toBeInstanceOf(VideoEntity);
      expect(result.id).toBe('video-uuid-1');
    });

    it('passes undefined description parts when description is null', async () => {
      video.create.mockResolvedValue(buildVideoRow());

      await repo.create({
        vimeoId: VimeoId.create('987654321'),
        title: { de: 'D', en: 'E', fa: 'F' },
        description: null,
      });

      expect(video.create).toHaveBeenCalledWith({
        data: {
          vimeoId: '987654321',
          titleDe: 'D',
          titleEn: 'E',
          titleFa: 'F',
          descDe: undefined,
          descEn: undefined,
          descFa: undefined,
        },
        include: VIDEO_INCLUDE,
      });
    });
  });

  describe('update', () => {
    it('updates only the provided fields and maps the row', async () => {
      video.update.mockResolvedValue(buildVideoRow());

      const result = await repo.update('video-uuid-1', {
        vimeoId: '555',
        title: { de: 'Neu DE' },
      });

      expect(video.update).toHaveBeenCalledWith({
        where: { id: 'video-uuid-1' },
        data: { vimeoId: '555', titleDe: 'Neu DE' },
        include: VIDEO_INCLUDE,
      });
      expect(result).toBeInstanceOf(VideoEntity);
    });

    it('clears all description columns when description is null', async () => {
      video.update.mockResolvedValue(buildVideoRow());

      await repo.update('video-uuid-1', { description: null });

      expect(video.update).toHaveBeenCalledWith({
        where: { id: 'video-uuid-1' },
        data: { descDe: null, descEn: null, descFa: null },
        include: VIDEO_INCLUDE,
      });
    });
  });

  describe('delete', () => {
    it('deletes the video by id', async () => {
      video.delete.mockResolvedValue(buildVideoRow());

      await repo.delete('video-uuid-1');

      expect(video.delete).toHaveBeenCalledWith({ where: { id: 'video-uuid-1' } });
    });
  });

  describe('findDocumentById', () => {
    it('queries by id and maps to a DocumentEntity', async () => {
      document.findUnique.mockResolvedValue(buildDocRow());

      const result = await repo.findDocumentById('doc-uuid-1');

      expect(document.findUnique).toHaveBeenCalledWith({ where: { id: 'doc-uuid-1' } });
      expect(result).toBeInstanceOf(DocumentEntity);
      expect(result?.id).toBe('doc-uuid-1');
      expect(result?.title).toBe('Transcript');
      expect(result?.storagePath).toBe('/docs/transcript.pdf');
      expect(result?.videoId).toBe('video-uuid-1');
    });

    it('returns null when no document is found', async () => {
      document.findUnique.mockResolvedValue(null);

      const result = await repo.findDocumentById('missing');

      expect(result).toBeNull();
    });
  });

  describe('addDocument', () => {
    it('creates a document and maps it to a DocumentEntity', async () => {
      document.create.mockResolvedValue(buildDocRow());

      const result = await repo.addDocument({
        title: 'Transcript',
        storagePath: '/docs/transcript.pdf',
        videoId: 'video-uuid-1',
      });

      expect(document.create).toHaveBeenCalledWith({
        data: { title: 'Transcript', storagePath: '/docs/transcript.pdf', videoId: 'video-uuid-1' },
      });
      expect(result).toBeInstanceOf(DocumentEntity);
      expect(result.id).toBe('doc-uuid-1');
    });
  });

  describe('updateDocument', () => {
    it('updates only provided fields and maps the result', async () => {
      document.update.mockResolvedValue(buildDocRow({ title: 'New Title' }));

      const result = await repo.updateDocument('doc-uuid-1', { title: 'New Title' });

      expect(document.update).toHaveBeenCalledWith({
        where: { id: 'doc-uuid-1' },
        data: { title: 'New Title' },
      });
      expect(result).toBeInstanceOf(DocumentEntity);
      expect(result.title).toBe('New Title');
    });
  });

  describe('deleteDocument', () => {
    it('deletes the document when it exists', async () => {
      document.findUnique.mockResolvedValue(buildDocRow());
      document.delete.mockResolvedValue(buildDocRow());

      await repo.deleteDocument('doc-uuid-1');

      expect(document.findUnique).toHaveBeenCalledWith({ where: { id: 'doc-uuid-1' } });
      expect(document.delete).toHaveBeenCalledWith({ where: { id: 'doc-uuid-1' } });
    });

    it('throws NotFoundException and does not delete when missing', async () => {
      document.findUnique.mockResolvedValue(null);

      await expect(repo.deleteDocument('missing')).rejects.toBeInstanceOf(NotFoundException);
      expect(document.delete).not.toHaveBeenCalled();
    });
  });
});
