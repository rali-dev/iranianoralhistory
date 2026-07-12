import { RemoveVideoHandler } from './remove-video.handler';
import { RemoveVideoCommand } from './remove-video.command';

const mockCollectionRepo = {
  findAll: jest.fn(),
  findBySlug: jest.fn(),
  findByType: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  assignVideo: jest.fn(),
  removeVideo: jest.fn(),
};

describe('RemoveVideoHandler', () => {
  let handler: RemoveVideoHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new RemoveVideoHandler(mockCollectionRepo as any);
  });

  it('calls repo.removeVideo with videoId and collectionId', async () => {
    mockCollectionRepo.removeVideo.mockResolvedValue(undefined);

    await handler.execute(new RemoveVideoCommand('col-uuid', 'video-uuid'));

    expect(mockCollectionRepo.removeVideo).toHaveBeenCalledWith('video-uuid', 'col-uuid');
  });

  it('returns void on success', async () => {
    mockCollectionRepo.removeVideo.mockResolvedValue(undefined);

    const result = await handler.execute(new RemoveVideoCommand('col-uuid', 'video-uuid'));

    expect(result).toBeUndefined();
  });
});
