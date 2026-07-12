import { AssignVideoHandler } from './assign-video.handler';
import { AssignVideoCommand } from './assign-video.command';

const mockCollectionRepo = {
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  assignVideo: jest.fn(),
};

describe('AssignVideoHandler', () => {
  let handler: AssignVideoHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new AssignVideoHandler(mockCollectionRepo as any);
  });

  it('calls repo.assignVideo with collectionId and videoId', async () => {
    mockCollectionRepo.assignVideo.mockResolvedValue(undefined);

    await handler.execute(new AssignVideoCommand('col-uuid', 'video-uuid'));

    expect(mockCollectionRepo.assignVideo).toHaveBeenCalledWith('video-uuid', 'col-uuid');
  });

  it('returns void on success', async () => {
    mockCollectionRepo.assignVideo.mockResolvedValue(undefined);

    const result = await handler.execute(new AssignVideoCommand('col-uuid', 'video-uuid'));

    expect(result).toBeUndefined();
  });
});
