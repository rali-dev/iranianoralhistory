import { NotFoundException } from '@nestjs/common';
import { CreateDocumentHandler } from './create-document.handler';
import { CreateDocumentCommand } from './create-document.command';
import { DocumentEntity, VideoEntity, VimeoId } from '@iranianoralhistory/backend-video-domain';

function buildDocument(): DocumentEntity {
  return new DocumentEntity('doc-uuid', 'Bewerbung.pdf', 'docs/bewerbung.pdf', 'video-uuid', new Date());
}

function buildVideoEntity(): VideoEntity {
  return new VideoEntity('video-uuid', VimeoId.create('123456789'), { de: 'T', en: 'T', fa: 'ت' }, null, [], [], new Date(), new Date());
}

const mockVideoRepo = {
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  addDocument: jest.fn(),
  updateDocument: jest.fn(),
  deleteDocument: jest.fn(),
  findDocumentById: jest.fn(),
};

describe('CreateDocumentHandler', () => {
  let handler: CreateDocumentHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new CreateDocumentHandler(mockVideoRepo as any);
  });

  it('adds and returns the new document', async () => {
    const doc = buildDocument();
    mockVideoRepo.findById.mockResolvedValue(buildVideoEntity());
    mockVideoRepo.addDocument.mockResolvedValue(doc);

    const result = await handler.execute(
      new CreateDocumentCommand({ title: 'Bewerbung.pdf', storagePath: 'docs/bewerbung.pdf', videoId: 'video-uuid' }),
    );

    expect(result).toBe(doc);
    expect(mockVideoRepo.addDocument).toHaveBeenCalledWith({
      title: 'Bewerbung.pdf',
      storagePath: 'docs/bewerbung.pdf',
      videoId: 'video-uuid',
    });
  });

  it('throws NotFoundException when the video does not exist', async () => {
    mockVideoRepo.findById.mockResolvedValue(null);

    await expect(
      handler.execute(
        new CreateDocumentCommand({ title: 'File.pdf', storagePath: 'docs/file.pdf', videoId: 'missing-uuid' }),
      ),
    ).rejects.toThrow(NotFoundException);

    expect(mockVideoRepo.addDocument).not.toHaveBeenCalled();
  });
});
