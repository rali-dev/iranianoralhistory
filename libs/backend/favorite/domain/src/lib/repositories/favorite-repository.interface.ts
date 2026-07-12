export interface IFavoriteRepository {
  add(userId: string, videoId: string): Promise<void>;
  remove(userId: string, videoId: string): Promise<void>;
  findVideoIdsByUser(userId: string): Promise<string[]>;
}

export const FAVORITE_REPOSITORY = Symbol('FAVORITE_REPOSITORY');
