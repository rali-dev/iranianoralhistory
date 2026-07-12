import { FavoriteController } from './favorite.controller';

const mockCommandBus = { execute: jest.fn() };
const mockQueryBus   = { execute: jest.fn() };

function buildController(): FavoriteController {
  return new FavoriteController(mockCommandBus as any, mockQueryBus as any);
}

function buildReq(userId = 'user-uuid') {
  return { user: { id: userId, email: 'u@t.de', role: 'USER' } };
}

describe('FavoriteController', () => {
  let controller: FavoriteController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = buildController();
  });

  describe('addFavorite()', () => {
    it('dispatches AddFavoriteCommand with userId and videoId from request', () => {
      mockCommandBus.execute.mockResolvedValue(undefined);

      controller.addFavorite(buildReq() as any, 'v-uuid');

      const [command] = mockCommandBus.execute.mock.calls[0];
      expect(command.constructor.name).toBe('AddFavoriteCommand');
      expect(command.userId).toBe('user-uuid');
      expect(command.videoId).toBe('v-uuid');
    });

    it('returns the result of commandBus.execute', async () => {
      mockCommandBus.execute.mockResolvedValue(undefined);

      const result = await controller.addFavorite(buildReq() as any, 'v-uuid');

      expect(result).toBeUndefined();
    });
  });

  describe('removeFavorite()', () => {
    it('dispatches RemoveFavoriteCommand with userId and videoId from request', () => {
      mockCommandBus.execute.mockResolvedValue(undefined);

      controller.removeFavorite(buildReq() as any, 'v-uuid');

      const [command] = mockCommandBus.execute.mock.calls[0];
      expect(command.constructor.name).toBe('RemoveFavoriteCommand');
      expect(command.userId).toBe('user-uuid');
      expect(command.videoId).toBe('v-uuid');
    });
  });

  describe('getUserFavorites()', () => {
    it('dispatches GetUserFavoritesQuery with the userId from request', () => {
      mockQueryBus.execute.mockResolvedValue(['v-uuid-1', 'v-uuid-2']);

      controller.getUserFavorites(buildReq() as any);

      const [query] = mockQueryBus.execute.mock.calls[0];
      expect(query.constructor.name).toBe('GetUserFavoritesQuery');
      expect(query.userId).toBe('user-uuid');
    });

    it('returns the list of favorite video ids', async () => {
      const ids = ['v-1', 'v-2'];
      mockQueryBus.execute.mockResolvedValue(ids);

      const result = await controller.getUserFavorites(buildReq() as any);

      expect(result).toEqual(ids);
    });
  });
});
