import { NotFoundException } from '@nestjs/common';
import { UpdateVideoHandler } from './update-video.handler';
import { UpdateVideoCommand } from './update-video.command';
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

describe('UpdateVideoHandler', () => {
  let handler: UpdateVideoHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new UpdateVideoHandler(mockVideoRepo as any);
    (handler as any).logger = mockLogger;
  });

  it('updates and returns the video', async () => {
    const video = buildVideoEntity();
    mockVideoRepo.findById.mockResolvedValue(video);
    mockVideoRepo.update.mockResolvedValue(video);

    const result = await handler.execute(
      new UpdateVideoCommand('video-uuid', { vimeoId: '987654321' }),
    );

    expect(result).toBe(video);
    expect(mockVideoRepo.update).toHaveBeenCalledWith('video-uuid', { vimeoId: '987654321' });
  });

  it('throws NotFoundException when the video does not exist', async () => {
    mockVideoRepo.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new UpdateVideoCommand('missing-uuid', {})),
    ).rejects.toThrow(NotFoundException);

    expect(mockVideoRepo.update).not.toHaveBeenCalled();
  });

  it('validates and normalizes (trims) the vimeoId through the value object', async () => {
    const video = buildVideoEntity();
    mockVideoRepo.findById.mockResolvedValue(video);
    mockVideoRepo.update.mockResolvedValue(video);

    await handler.execute(new UpdateVideoCommand('video-uuid', { vimeoId: '  987654321  ' }));

    expect(mockVideoRepo.update).toHaveBeenCalledWith('video-uuid', { vimeoId: '987654321' });
  });

  it('rejects a non-numeric vimeoId without touching the repository', async () => {
    mockVideoRepo.findById.mockResolvedValue(buildVideoEntity());

    await expect(
      handler.execute(new UpdateVideoCommand('video-uuid', { vimeoId: 'not-a-number' })),
    ).rejects.toThrow(/Vimeo/i);

    expect(mockVideoRepo.update).not.toHaveBeenCalled();
  });

  it('leaves the dto untouched when no vimeoId is provided', async () => {
    const video = buildVideoEntity();
    mockVideoRepo.findById.mockResolvedValue(video);
    mockVideoRepo.update.mockResolvedValue(video);

    await handler.execute(
      new UpdateVideoCommand('video-uuid', { title: { de: 'Neu', en: 'New', fa: 'نو' } }),
    );

    expect(mockVideoRepo.update).toHaveBeenCalledWith('video-uuid', {
      title: { de: 'Neu', en: 'New', fa: 'نو' },
    });
  });
});
