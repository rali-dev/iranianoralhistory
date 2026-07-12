import { NotFoundException } from '@nestjs/common';
import { GetVideoByIdHandler } from './get-video-by-id.handler';
import { GetVideoByIdQuery } from './get-video-by-id.query';
import { VideoEntity, VimeoId } from '@iranianoralhistory/backend-video-domain';

function buildVideoEntity(id: string): VideoEntity {
  return new VideoEntity(
    id,
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
  findById: jest.fn(),
};

describe('GetVideoByIdHandler', () => {
  let handler: GetVideoByIdHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new GetVideoByIdHandler(mockVideoRepo as any);
  });

  it('returns the requested video', async () => {
    const video = buildVideoEntity('video-1');
    mockVideoRepo.findById.mockResolvedValue(video);

    const result = await handler.execute(new GetVideoByIdQuery('video-1'));

    expect(result).toBe(video);
    expect(mockVideoRepo.findById).toHaveBeenCalledWith('video-1');
  });

  it('throws NotFoundException when the video does not exist', async () => {
    mockVideoRepo.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new GetVideoByIdQuery('unknown-id')),
    ).rejects.toThrow(new NotFoundException('Video unknown-id not found'));
  });
});
