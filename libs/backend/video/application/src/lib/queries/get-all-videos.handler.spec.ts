import { GetAllVideosHandler } from './get-all-videos.handler';
import { GetAllVideosQuery } from './get-all-videos.query';
import { VideoEntity, VimeoId } from '@iranianoralhistory/backend-video-domain';

function buildVideoEntity(id: string, vimeoId: string): VideoEntity {
  return new VideoEntity(
    id,
    VimeoId.create(vimeoId),
    { de: 'Titel', en: 'Title', fa: 'عنوان' },
    null,
    [],
    [],
    new Date(),
    new Date(),
  );
}

const mockVideoRepo = {
  findAll: jest.fn(),
};

describe('GetAllVideosHandler', () => {
  let handler: GetAllVideosHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new GetAllVideosHandler(mockVideoRepo as any);
  });

  it('returns all videos', async () => {
    const videos = [
      buildVideoEntity('id-1', '111'),
      buildVideoEntity('id-2', '222'),
    ];
    mockVideoRepo.findAll.mockResolvedValue(videos);

    const result = await handler.execute(new GetAllVideosQuery());

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('id-1');
    expect(result[1].id).toBe('id-2');
  });

  it('returns an empty list when no videos exist', async () => {
    mockVideoRepo.findAll.mockResolvedValue([]);

    const result = await handler.execute(new GetAllVideosQuery());

    expect(result).toEqual([]);
  });

  it('delegates directly to the repository without transformation', async () => {
    mockVideoRepo.findAll.mockResolvedValue([]);

    await handler.execute(new GetAllVideosQuery());

    expect(mockVideoRepo.findAll).toHaveBeenCalledTimes(1);
  });
});
