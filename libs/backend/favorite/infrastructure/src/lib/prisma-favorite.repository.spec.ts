import { PrismaService } from '@iranianoralhistory/backend-shared-database';
import { PrismaFavoriteRepository } from './prisma-favorite.repository';

type UserFavoriteDelegate = {
  upsert: jest.Mock;
  deleteMany: jest.Mock;
  findMany: jest.Mock;
};

describe('PrismaFavoriteRepository', () => {
  let userFavorite: UserFavoriteDelegate;
  let repo: PrismaFavoriteRepository;

  beforeEach(() => {
    userFavorite = {
      upsert: jest.fn(),
      deleteMany: jest.fn(),
      findMany: jest.fn(),
    };
    const prisma = { userFavorite } as unknown as PrismaService;
    repo = new PrismaFavoriteRepository(prisma);
  });

  afterEach(() => jest.clearAllMocks());

  describe('add', () => {
    it('upserts the favorite idempotently on the composite key', async () => {
      userFavorite.upsert.mockResolvedValue({});

      await repo.add('user-uuid-1', 'video-uuid-1');

      expect(userFavorite.upsert).toHaveBeenCalledWith({
        where: { userId_videoId: { userId: 'user-uuid-1', videoId: 'video-uuid-1' } },
        create: { userId: 'user-uuid-1', videoId: 'video-uuid-1' },
        update: {},
      });
    });

    it('is idempotent when called twice with the same args', async () => {
      userFavorite.upsert.mockResolvedValue({});

      await repo.add('user-uuid-1', 'video-uuid-1');
      await repo.add('user-uuid-1', 'video-uuid-1');

      const expectedUpsert = {
        where: { userId_videoId: { userId: 'user-uuid-1', videoId: 'video-uuid-1' } },
        create: { userId: 'user-uuid-1', videoId: 'video-uuid-1' },
        update: {},
      };
      expect(userFavorite.upsert).toHaveBeenCalledTimes(2);
      expect(userFavorite.upsert).toHaveBeenNthCalledWith(1, expectedUpsert);
      expect(userFavorite.upsert).toHaveBeenNthCalledWith(2, expectedUpsert);
    });
  });

  describe('remove', () => {
    it('deletes the favorite for the user + video', async () => {
      userFavorite.deleteMany.mockResolvedValue({ count: 1 });

      await repo.remove('user-uuid-1', 'video-uuid-1');

      expect(userFavorite.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-uuid-1', videoId: 'video-uuid-1' },
      });
    });

    it('is idempotent — still issues the scoped deleteMany and resolves when count is 0', async () => {
      userFavorite.deleteMany.mockResolvedValue({ count: 0 });

      await expect(repo.remove('user-uuid-1', 'video-uuid-1')).resolves.toBeUndefined();

      // Auch im „nichts zu löschen"-Fall muss der Query korrekt eingegrenzt sein.
      expect(userFavorite.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-uuid-1', videoId: 'video-uuid-1' },
      });
    });
  });

  describe('findVideoIdsByUser', () => {
    it('returns the favorited video ids ordered by createdAt desc', async () => {
      userFavorite.findMany.mockResolvedValue([
        { videoId: 'video-uuid-1' },
        { videoId: 'video-uuid-2' },
      ]);

      const result = await repo.findVideoIdsByUser('user-uuid-1');

      expect(userFavorite.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-uuid-1' },
        select: { videoId: true },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(['video-uuid-1', 'video-uuid-2']);
    });

    it('returns an empty array when the user has no favorites', async () => {
      userFavorite.findMany.mockResolvedValue([]);

      const result = await repo.findVideoIdsByUser('user-uuid-1');

      expect(result).toEqual([]);
    });
  });
});
