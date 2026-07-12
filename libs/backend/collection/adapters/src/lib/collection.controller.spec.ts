import { CollectionController } from './collection.controller';

const mockCommandBus = { execute: jest.fn() };
const mockQueryBus   = { execute: jest.fn() };

function buildController(): CollectionController {
  return new CollectionController(mockCommandBus as any, mockQueryBus as any);
}

function buildCollectionDto() {
  return {
    id: 'col-uuid',
    slug: 'person-ali',
    type: 'PERSON' as const,
    name: { de: 'Ali', en: 'Ali', fa: 'علی' },
    description: null,
    sortOrder: 0,
  };
}

describe('CollectionController', () => {
  let controller: CollectionController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = buildController();
  });

  describe('findAll()', () => {
    it('dispatches GetAllCollectionsQuery', () => {
      mockQueryBus.execute.mockResolvedValue([]);

      controller.findAll();

      const [query] = mockQueryBus.execute.mock.calls[0];
      expect(query.constructor.name).toBe('GetAllCollectionsQuery');
    });
  });

  describe('create()', () => {
    it('dispatches CreateCollectionCommand with the dto', () => {
      mockCommandBus.execute.mockResolvedValue(buildCollectionDto());
      const dto = { slug: 'person-ali', type: 'PERSON', name: { de: 'Ali', en: 'Ali', fa: 'علی' } };

      controller.create(dto as any);

      const [command] = mockCommandBus.execute.mock.calls[0];
      expect(command.constructor.name).toBe('CreateCollectionCommand');
      expect(command.dto).toEqual(dto);
    });
  });

  describe('update()', () => {
    it('dispatches UpdateCollectionCommand with id and dto', () => {
      mockCommandBus.execute.mockResolvedValue(buildCollectionDto());
      const dto = { slug: 'updated-slug' };

      controller.update('col-uuid', dto as any);

      const [command] = mockCommandBus.execute.mock.calls[0];
      expect(command.constructor.name).toBe('UpdateCollectionCommand');
      expect(command.id).toBe('col-uuid');
      expect(command.dto).toEqual(dto);
    });
  });

  describe('delete()', () => {
    it('dispatches DeleteCollectionCommand with the given id', () => {
      mockCommandBus.execute.mockResolvedValue(undefined);

      controller.delete('col-uuid');

      const [command] = mockCommandBus.execute.mock.calls[0];
      expect(command.constructor.name).toBe('DeleteCollectionCommand');
      expect(command.id).toBe('col-uuid');
    });
  });

  describe('assignVideo()', () => {
    it('dispatches AssignVideoCommand with collectionId and videoId', () => {
      mockCommandBus.execute.mockResolvedValue(undefined);

      controller.assignVideo('col-uuid', 'v-uuid');

      const [command] = mockCommandBus.execute.mock.calls[0];
      expect(command.constructor.name).toBe('AssignVideoCommand');
      expect(command.collectionId).toBe('col-uuid');
      expect(command.videoId).toBe('v-uuid');
    });
  });

  describe('removeVideo()', () => {
    it('dispatches RemoveVideoCommand with collectionId and videoId', () => {
      mockCommandBus.execute.mockResolvedValue(undefined);

      controller.removeVideo('col-uuid', 'v-uuid');

      const [command] = mockCommandBus.execute.mock.calls[0];
      expect(command.constructor.name).toBe('RemoveVideoCommand');
      expect(command.collectionId).toBe('col-uuid');
      expect(command.videoId).toBe('v-uuid');
    });
  });
});
