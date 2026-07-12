import { VideoController } from './video.controller';

const mockCommandBus = { execute: jest.fn() };
const mockQueryBus   = { execute: jest.fn() };

function buildController(): VideoController {
  return new VideoController(mockCommandBus as any, mockQueryBus as any);
}

function buildVideoDto() {
  return {
    id: 'v-uuid',
    vimeoId: '123456789',
    title: { de: 'Titel', en: 'Title', fa: 'عنوان' },
    description: null,
    documents: [],
    collections: [],
  };
}

describe('VideoController', () => {
  let controller: VideoController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = buildController();
  });

  describe('findAll()', () => {
    it('dispatches GetAllVideosQuery', () => {
      mockQueryBus.execute.mockResolvedValue([]);

      controller.findAll();

      const [query] = mockQueryBus.execute.mock.calls[0];
      expect(query.constructor.name).toBe('GetAllVideosQuery');
    });
  });

  describe('findById()', () => {
    it('dispatches GetVideoByIdQuery with the given id', () => {
      mockQueryBus.execute.mockResolvedValue(buildVideoDto());

      controller.findById('v-uuid');

      const [query] = mockQueryBus.execute.mock.calls[0];
      expect(query.constructor.name).toBe('GetVideoByIdQuery');
      expect(query.id).toBe('v-uuid');
    });
  });

  describe('create()', () => {
    it('dispatches CreateVideoCommand with the dto', () => {
      mockCommandBus.execute.mockResolvedValue(buildVideoDto());
      const dto = { vimeoId: '111', title: { de: 'T', en: 'T', fa: 'ت' } };

      controller.create(dto as any);

      const [command] = mockCommandBus.execute.mock.calls[0];
      expect(command.constructor.name).toBe('CreateVideoCommand');
      expect(command.dto).toEqual(dto);
    });
  });

  describe('update()', () => {
    it('dispatches UpdateVideoCommand with id and dto', () => {
      mockCommandBus.execute.mockResolvedValue(buildVideoDto());
      const dto = { vimeoId: '222' };

      controller.update('v-uuid', dto as any);

      const [command] = mockCommandBus.execute.mock.calls[0];
      expect(command.constructor.name).toBe('UpdateVideoCommand');
      expect(command.id).toBe('v-uuid');
      expect(command.dto).toEqual(dto);
    });
  });

  describe('delete()', () => {
    it('dispatches DeleteVideoCommand with the given id', () => {
      mockCommandBus.execute.mockResolvedValue(undefined);

      controller.delete('v-uuid');

      const [command] = mockCommandBus.execute.mock.calls[0];
      expect(command.constructor.name).toBe('DeleteVideoCommand');
      expect(command.id).toBe('v-uuid');
    });
  });

  describe('addDocument()', () => {
    it('dispatches CreateDocumentCommand with videoId merged into dto', () => {
      mockCommandBus.execute.mockResolvedValue({ id: 'doc-uuid', title: 'Doc' });
      const dto = { title: 'Doc', storagePath: 'path/doc.pdf' };

      controller.addDocument('v-uuid', dto as any);

      const [command] = mockCommandBus.execute.mock.calls[0];
      expect(command.constructor.name).toBe('CreateDocumentCommand');
      expect(command.data.videoId).toBe('v-uuid');
      expect(command.data.title).toBe('Doc');
    });
  });

  describe('updateDocument()', () => {
    it('dispatches UpdateDocumentCommand with docId and dto', () => {
      mockCommandBus.execute.mockResolvedValue({ id: 'doc-uuid' });
      const dto = { title: 'Updated Doc' };

      controller.updateDocument('doc-uuid', dto as any);

      const [command] = mockCommandBus.execute.mock.calls[0];
      expect(command.constructor.name).toBe('UpdateDocumentCommand');
      expect(command.docId).toBe('doc-uuid');
    });
  });

  describe('deleteDocument()', () => {
    it('dispatches DeleteDocumentCommand with the given docId', () => {
      mockCommandBus.execute.mockResolvedValue(undefined);

      controller.deleteDocument('doc-uuid');

      const [command] = mockCommandBus.execute.mock.calls[0];
      expect(command.constructor.name).toBe('DeleteDocumentCommand');
      expect(command.docId).toBe('doc-uuid');
    });
  });
});
