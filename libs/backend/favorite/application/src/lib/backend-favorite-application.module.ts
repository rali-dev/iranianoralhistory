import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AddFavoriteHandler } from './commands/add-favorite.handler';
import { RemoveFavoriteHandler } from './commands/remove-favorite.handler';
import { GetUserFavoritesHandler } from './queries/get-user-favorites.handler';

const COMMAND_HANDLERS = [AddFavoriteHandler, RemoveFavoriteHandler];
const QUERY_HANDLERS = [GetUserFavoritesHandler];

@Module({
  imports: [CqrsModule],
  providers: [...COMMAND_HANDLERS, ...QUERY_HANDLERS],
  exports: [CqrsModule],
})
export class BackendFavoriteApplicationModule {}
