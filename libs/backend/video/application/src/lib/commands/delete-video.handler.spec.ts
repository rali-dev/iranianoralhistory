import { NotFoundException } from '@nestjs/common';
import { DeleteVideoHandler } from './delete-video.handler';
import { DeleteVideoCommand } from './delete-video.command';
import { VideoEntity, VimeoId } from '@iranianoralhistory/backend-video-domain';

function buildVideoEntity(): VideoEntity {
  return new VideoEntity(
    'video-uuid',
    VimeoId.create('123456789'),
    { de: 'Titel', en: 'Title', fa: 'عنوان' },
    null,
    [],
    [],
    new Date(),
    new Date(),
  );
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

const mockLogger = { log: jest.fn() };

describe('DeleteVideoHandler', () => {
  let handler: DeleteVideoHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new DeleteVideoHandler(mockVideoRepo as any);
    (handler as any).logger = mockLogger;
  });

  it('deletes the video when it exists', async () => {
    mockVideoRepo.findById.mockResolvedValue(buildVideoEntity());
    mockVideoRepo.delete.mockResolvedValue(undefined);

    await handler.execute(new DeleteVideoCommand('video-uuid'));

    expect(mockVideoRepo.delete).toHaveBeenCalledWith('video-uuid');
  });

  it('throws NotFoundException when the video does not exist', async () => {
    mockVideoRepo.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new DeleteVideoCommand('missing-uuid')),
    ).rejects.toThrow(NotFoundException);

    expect(mockVideoRepo.delete).not.toHaveBeenCalled();
  });

  it('returns void on success', async () => {
    mockVideoRepo.findById.mockResolvedValue(buildVideoEntity());
    mockVideoRepo.delete.mockResolvedValue(undefined);

    const result = await handler.execute(new DeleteVideoCommand('video-uuid'));

    expect(result).toBeUndefined();
  });
});
