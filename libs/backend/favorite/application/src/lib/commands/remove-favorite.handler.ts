import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  IFavoriteRepository,
  FAVORITE_REPOSITORY,
} from '@iranianoralhistory/backend-favorite-domain';
import { RemoveFavoriteCommand } from './remove-favorite.command';

@Injectable()
@CommandHandler(RemoveFavoriteCommand)
export class RemoveFavoriteHandler implements ICommandHandler<RemoveFavoriteCommand, void> {
  constructor(
    @Inject(FAVORITE_REPOSITORY)
    private readonly favoriteRepo: IFavoriteRepository,
  ) {}

  async execute(command: RemoveFavoriteCommand): Promise<void> {
    await this.favoriteRepo.remove(command.userId, command.videoId);
  }
}
