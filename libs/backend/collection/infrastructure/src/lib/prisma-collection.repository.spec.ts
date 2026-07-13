import { PrismaService } from '@iranianoralhistory/backend-shared-database';
import { CollectionEntity } from '@iranianoralhistory/backend-collection-domain';
import { PrismaCollectionRepository } from './prisma-collection.repository';

type CollectionDelegate = {
  findMany: jest.Mock;
  findUnique: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
};

type VideoCollectionDelegate = {
  upsert: jest.Mock;
  deleteMany: jest.Mock;
};

const COUNT_INCLUDE = { _count: { select: { videos: true } } };
const LIST_ORDER = [{ sortOrder: 'asc' }, { createdAt: 'asc' }];

function buildCollectionRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'coll-uuid-1',
    slug: 'person-slug',
    type: 'PERSON',
    nameDe: 'Name DE',
    nameEn: 'Name EN',
    nameFa: 'Name FA',
    descDe: 'Beschreibung DE',
    descEn: 'Description EN',
    descFa: 'توضیحات FA',
    sortOrder: 3,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-02T00:00:00.000Z'),
    _count: { videos: 7 },
    ...overrides,
  };
}

describe('PrismaCollectionRepository', () => {
  let collection: CollectionDelegate;
  let videoCollection: VideoCollectionDelegate;
  let repo: PrismaCollectionRepository;

  beforeEach(() => {
    collection = {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    videoCollection = {
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    };
    const prisma = { collection, videoCollection } as unknown as PrismaService;
    repo = new PrismaCollectionRepository(prisma);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('lists collections with video counts and maps them', async () => {
      collection.findMany.mockResolvedValue([buildCollectionRow()]);

      const result = await repo.findAll();

      expect(collection.findMany).toHaveBeenCalledWith({
        include: COUNT_INCLUDE,
        orderBy: LIST_ORDER,
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(CollectionEntity);
      expect(result[0].id).toBe('coll-uuid-1');
      expect(result[0].type).toBe('PERSON');
      expect(result[0].name).toEqual({ de: 'Name DE', en: 'Name EN', fa: 'Name FA' });
      expect(result[0].videoCount).toBe(7);
      expect(result[0].sortOrder).toBe(3);
    });
  });

  describe('findBySlug', () => {
    it('queries by slug and maps the row', async () => {
      collection.findUnique.mockResolvedValue(buildCollectionRow());

      const result = await repo.findBySlug('person-slug');

      expect(collection.findUnique).toHaveBeenCalledWith({
        where: { slug: 'person-slug' },
        include: COUNT_INCLUDE,
      });
      expect(result).toBeInstanceOf(CollectionEntity);
      expect(result?.description).toEqual({
        de: 'Beschreibung DE',
        en: 'Description EN',
        fa: 'توضیحات FA',
      });
    });

    it('returns null when no row is found', async () => {
      collection.findUnique.mockResolvedValue(null);

      const result = await repo.findBySlug('missing');

      expect(result).toBeNull();
    });

    it('maps a null description only when ALL language columns are null', async () => {
      collection.findUnique.mockResolvedValue(
        buildCollectionRow({ descDe: null, descEn: null, descFa: null }),
      );

      const result = await repo.findBySlug('person-slug');

      expect(result?.description).toBeNull();
    });

    // Regression (Datenverlust-Bug): früher wurde die gesamte mehrsprachige
    // Beschreibung verworfen, sobald `descDe` null/leer war — auch wenn EN/FA
    // gepflegt waren. Jetzt bleibt jede vorhandene Sprache erhalten.
    it('preserves EN/FA description when only descDe is null', async () => {
      collection.findUnique.mockResolvedValue(
        buildCollectionRow({ descDe: null, descEn: 'Description EN', descFa: 'توضیحات FA' }),
      );

      const result = await repo.findBySlug('person-slug');

      expect(result?.description).toEqual({
        de: '',
        en: 'Description EN',
        fa: 'توضیحات FA',
      });
    });

    it('preserves DE/FA description when only descEn is null', async () => {
      collection.findUnique.mockResolvedValue(
        buildCollectionRow({ descDe: 'Beschreibung DE', descEn: null, descFa: 'توضیحات FA' }),
      );

      const result = await repo.findBySlug('person-slug');

      expect(result?.description).toEqual({
        de: 'Beschreibung DE',
        en: '',
        fa: 'توضیحات FA',
      });
    });
  });

  describe('findByType', () => {
    it('filters by type and maps the rows', async () => {
      collection.findMany.mockResolvedValue([buildCollectionRow({ type: 'TOPIC' })]);

      const result = await repo.findByType('TOPIC');

      expect(collection.findMany).toHaveBeenCalledWith({
        where: { type: 'TOPIC' },
        include: COUNT_INCLUDE,
        orderBy: LIST_ORDER,
      });
      expect(result[0].type).toBe('TOPIC');
    });
  });

  describe('create', () => {
    it('creates a collection from CreateCollectionInput and maps the row', async () => {
      collection.create.mockResolvedValue(buildCollectionRow());

      const result = await repo.create({
        slug: 'person-slug',
        type: 'PERSON',
        name: { de: 'Name DE', en: 'Name EN', fa: 'Name FA' },
        description: { de: 'Beschreibung DE', en: 'Description EN', fa: 'توضیحات FA' },
        sortOrder: 3,
      });

      expect(collection.create).toHaveBeenCalledWith({
        data: {
          slug: 'person-slug',
          type: 'PERSON',
          nameDe: 'Name DE',
          nameEn: 'Name EN',
          nameFa: 'Name FA',
          descDe: 'Beschreibung DE',
          descEn: 'Description EN',
          descFa: 'توضیحات FA',
          sortOrder: 3,
        },
        include: COUNT_INCLUDE,
      });
      expect(result).toBeInstanceOf(CollectionEntity);
    });

    it('passes undefined description parts when description is null', async () => {
      collection.create.mockResolvedValue(buildCollectionRow());

      await repo.create({
        slug: 'topic-slug',
        type: 'TOPIC',
        name: { de: 'D', en: 'E', fa: 'F' },
        description: null,
        sortOrder: 0,
      });

      expect(collection.create).toHaveBeenCalledWith({
        data: {
          slug: 'topic-slug',
          type: 'TOPIC',
          nameDe: 'D',
          nameEn: 'E',
          nameFa: 'F',
          descDe: undefined,
          descEn: undefined,
          descFa: undefined,
          sortOrder: 0,
        },
        include: COUNT_INCLUDE,
      });
    });
  });

  describe('update', () => {
    it('updates only the provided fields and maps the row', async () => {
      collection.update.mockResolvedValue(buildCollectionRow());

      const result = await repo.update('coll-uuid-1', {
        slug: 'new-slug',
        name: { de: 'Neu DE' },
        sortOrder: 9,
      });

      expect(collection.update).toHaveBeenCalledWith({
        where: { id: 'coll-uuid-1' },
        data: { slug: 'new-slug', nameDe: 'Neu DE', sortOrder: 9 },
        include: COUNT_INCLUDE,
      });
      expect(result).toBeInstanceOf(CollectionEntity);
    });

    it('clears all description columns when description is null', async () => {
      collection.update.mockResolvedValue(buildCollectionRow());

      await repo.update('coll-uuid-1', { description: null });

      expect(collection.update).toHaveBeenCalledWith({
        where: { id: 'coll-uuid-1' },
        data: { descDe: null, descEn: null, descFa: null },
        include: COUNT_INCLUDE,
      });
    });

    // Deckt den bisher untesteten Partial-Description-Zweig ab: nur die
    // angegebene Sprache wird gepatcht, die übrigen bleiben unangetastet.
    it('patches only the provided description language, leaving others intact', async () => {
      collection.update.mockResolvedValue(buildCollectionRow());

      await repo.update('coll-uuid-1', { description: { en: 'Only EN changed' } });

      expect(collection.update).toHaveBeenCalledWith({
        where: { id: 'coll-uuid-1' },
        data: { descEn: 'Only EN changed' },
        include: COUNT_INCLUDE,
      });
    });

    it('patches only descDe when only the German description is given', async () => {
      collection.update.mockResolvedValue(buildCollectionRow());

      await repo.update('coll-uuid-1', { description: { de: 'Only DE changed' } });

      expect(collection.update).toHaveBeenCalledWith({
        where: { id: 'coll-uuid-1' },
        data: { descDe: 'Only DE changed' },
        include: COUNT_INCLUDE,
      });
    });

    it('patches only descFa when only the Farsi description is given', async () => {
      collection.update.mockResolvedValue(buildCollectionRow());

      await repo.update('coll-uuid-1', { description: { fa: 'فقط فارسی' } });

      expect(collection.update).toHaveBeenCalledWith({
        where: { id: 'coll-uuid-1' },
        data: { descFa: 'فقط فارسی' },
        include: COUNT_INCLUDE,
      });
    });

    it('trims the slug before persisting', async () => {
      collection.update.mockResolvedValue(buildCollectionRow());

      await repo.update('coll-uuid-1', { slug: '  spaced-slug  ' });

      expect(collection.update).toHaveBeenCalledWith({
        where: { id: 'coll-uuid-1' },
        data: { slug: 'spaced-slug' },
        include: COUNT_INCLUDE,
      });
    });

    it('rejects an invalid patch (blank slug) before touching the database', async () => {
      await expect(repo.update('coll-uuid-1', { slug: '   ' })).rejects.toThrow(
        /slug must not be empty/,
      );
      expect(collection.update).not.toHaveBeenCalled();
    });

    it('updates individual name languages independently', async () => {
      collection.update.mockResolvedValue(buildCollectionRow());

      await repo.update('coll-uuid-1', { name: { en: 'New EN', fa: 'نام جدید' } });

      expect(collection.update).toHaveBeenCalledWith({
        where: { id: 'coll-uuid-1' },
        data: { nameEn: 'New EN', nameFa: 'نام جدید' },
        include: COUNT_INCLUDE,
      });
    });
  });

  describe('delete', () => {
    it('deletes the collection by id', async () => {
      collection.delete.mockResolvedValue(buildCollectionRow());

      await repo.delete('coll-uuid-1');

      expect(collection.delete).toHaveBeenCalledWith({ where: { id: 'coll-uuid-1' } });
    });

    // Das Repo fängt Prisma-Fehler NICHT ab (kein try/catch) — es reicht sie
    // unverändert nach oben, wo der globale PrismaExceptionFilter sie übersetzt.
    // Der Test verankert genau dieses Nicht-Schlucken (Identität des Fehlers);
    // die HTTP-Übersetzung selbst prüft der Integrationstest.
    it('does not swallow a rejection from prisma.delete — re-throws it verbatim', async () => {
      const err = new Error('delete failed');
      collection.delete.mockRejectedValue(err);

      await expect(repo.delete('missing-id')).rejects.toBe(err);
    });
  });

  describe('assignVideo', () => {
    it('upserts the video-collection link idempotently', async () => {
      videoCollection.upsert.mockResolvedValue({});

      await repo.assignVideo('video-uuid-1', 'coll-uuid-1');

      expect(videoCollection.upsert).toHaveBeenCalledWith({
        where: { videoId_collectionId: { videoId: 'video-uuid-1', collectionId: 'coll-uuid-1' } },
        create: { videoId: 'video-uuid-1', collectionId: 'coll-uuid-1' },
        update: {},
      });
    });

    // Ein FK-Verstoß (unbekannte collection/video) darf nicht geschluckt werden;
    // die 400-Übersetzung des P2003 prüft der Integrationstest.
    it('does not swallow a rejection from prisma.upsert — re-throws it verbatim', async () => {
      const err = new Error('fk violation');
      videoCollection.upsert.mockRejectedValue(err);

      await expect(repo.assignVideo('ghost-video', 'ghost-coll')).rejects.toBe(err);
    });
  });

  describe('removeVideo', () => {
    it('deletes the video-collection link', async () => {
      videoCollection.deleteMany.mockResolvedValue({ count: 1 });

      await repo.removeVideo('video-uuid-1', 'coll-uuid-1');

      expect(videoCollection.deleteMany).toHaveBeenCalledWith({
        where: { videoId: 'video-uuid-1', collectionId: 'coll-uuid-1' },
      });
    });

    it('is idempotent — still issues the scoped deleteMany and resolves when count is 0', async () => {
      videoCollection.deleteMany.mockResolvedValue({ count: 0 });

      await expect(repo.removeVideo('video-uuid-1', 'coll-uuid-1')).resolves.toBeUndefined();
      expect(videoCollection.deleteMany).toHaveBeenCalledWith({
        where: { videoId: 'video-uuid-1', collectionId: 'coll-uuid-1' },
      });
    });

    it('does not swallow an unexpected database rejection — re-throws it verbatim', async () => {
      const err = new Error('db down');
      videoCollection.deleteMany.mockRejectedValue(err);

      await expect(repo.removeVideo('v', 'c')).rejects.toBe(err);
    });
  });
});
