import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  IFavoriteRepository,
  FAVORITE_REPOSITORY,
} from '@iranianoralhistory/backend-favorite-domain';
import { AddFavoriteCommand } from './add-favorite.command';

@Injectable()
@CommandHandler(AddFavoriteCommand)
export class AddFavoriteHandler implements ICommandHandler<AddFavoriteCommand, void> {
  constructor(
    @Inject(FAVORITE_REPOSITORY)
    private readonly favoriteRepo: IFavoriteRepository,
  ) {}

  async execute(command: AddFavoriteCommand): Promise<void> {
    await this.favoriteRepo.add(command.userId, command.videoId);
  }
}
