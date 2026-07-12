import { AddFavoriteHandler } from './add-favorite.handler';
import { AddFavoriteCommand } from './add-favorite.command';

const mockFavoriteRepo = {
  add: jest.fn(),
};

describe('AddFavoriteHandler', () => {
  let handler: AddFavoriteHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new AddFavoriteHandler(mockFavoriteRepo as any);
  });

  it('adds a favourite', async () => {
    mockFavoriteRepo.add.mockResolvedValue(undefined);

    await handler.execute(new AddFavoriteCommand('user-1', 'video-1'));

    expect(mockFavoriteRepo.add).toHaveBeenCalledWith('user-1', 'video-1');
    expect(mockFavoriteRepo.add).toHaveBeenCalledTimes(1);
  });

  it('delegates the correct userId and videoId', async () => {
    mockFavoriteRepo.add.mockResolvedValue(undefined);

    await handler.execute(new AddFavoriteCommand('user-abc', 'video-xyz'));

    expect(mockFavoriteRepo.add).toHaveBeenCalledWith('user-abc', 'video-xyz');
  });
});
