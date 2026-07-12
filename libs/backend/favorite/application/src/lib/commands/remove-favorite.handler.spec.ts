import { RemoveFavoriteHandler } from './remove-favorite.handler';
import { RemoveFavoriteCommand } from './remove-favorite.command';

const mockFavoriteRepo = {
  remove: jest.fn(),
};

describe('RemoveFavoriteHandler', () => {
  let handler: RemoveFavoriteHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new RemoveFavoriteHandler(mockFavoriteRepo as any);
  });

  it('removes a favourite', async () => {
    mockFavoriteRepo.remove.mockResolvedValue(undefined);

    await handler.execute(new RemoveFavoriteCommand('user-1', 'video-1'));

    expect(mockFavoriteRepo.remove).toHaveBeenCalledWith('user-1', 'video-1');
    expect(mockFavoriteRepo.remove).toHaveBeenCalledTimes(1);
  });

  it('delegates the correct userId and videoId', async () => {
    mockFavoriteRepo.remove.mockResolvedValue(undefined);

    await handler.execute(new RemoveFavoriteCommand('user-abc', 'video-xyz'));

    expect(mockFavoriteRepo.remove).toHaveBeenCalledWith('user-abc', 'video-xyz');
  });
});
