import { GetUserFavoritesHandler } from './get-user-favorites.handler';
import { GetUserFavoritesQuery } from './get-user-favorites.query';

const mockFavoriteRepo = {
  findVideoIdsByUser: jest.fn(),
};

describe('GetUserFavoritesHandler', () => {
  let handler: GetUserFavoritesHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new GetUserFavoritesHandler(mockFavoriteRepo as any);
  });

  it('returns the list of video IDs for the user', async () => {
    const videoIds = ['video-1', 'video-2', 'video-3'];
    mockFavoriteRepo.findVideoIdsByUser.mockResolvedValue(videoIds);

    const result = await handler.execute(new GetUserFavoritesQuery('user-1'));

    expect(result).toEqual(videoIds);
    expect(mockFavoriteRepo.findVideoIdsByUser).toHaveBeenCalledWith('user-1');
  });

  it('returns an empty list when the user has no favourites', async () => {
    mockFavoriteRepo.findVideoIdsByUser.mockResolvedValue([]);

    const result = await handler.execute(new GetUserFavoritesQuery('user-with-no-favourites'));

    expect(result).toEqual([]);
  });
});
