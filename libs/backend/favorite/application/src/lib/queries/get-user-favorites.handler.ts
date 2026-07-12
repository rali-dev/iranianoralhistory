import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  IFavoriteRepository,
  FAVORITE_REPOSITORY,
} from '@iranianoralhistory/backend-favorite-domain';
import { GetUserFavoritesQuery } from './get-user-favorites.query';

@Injectable()
@QueryHandler(GetUserFavoritesQuery)
export class GetUserFavoritesHandler implements IQueryHandler<GetUserFavoritesQuery, string[]> {
  constructor(
    @Inject(FAVORITE_REPOSITORY)
    private readonly favoriteRepo: IFavoriteRepository,
  ) {}

  async execute(query: GetUserFavoritesQuery): Promise<string[]> {
    return this.favoriteRepo.findVideoIdsByUser(query.userId);
  }
}
