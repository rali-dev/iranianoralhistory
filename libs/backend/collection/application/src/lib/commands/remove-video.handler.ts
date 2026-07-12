import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  ICollectionRepository,
  COLLECTION_REPOSITORY,
} from '@iranianoralhistory/backend-collection-domain';
import { RemoveVideoCommand } from './remove-video.command';

@Injectable()
@CommandHandler(RemoveVideoCommand)
export class RemoveVideoHandler implements ICommandHandler<RemoveVideoCommand, void> {
  constructor(
    @Inject(COLLECTION_REPOSITORY)
    private readonly collectionRepo: ICollectionRepository,
  ) {}

  async execute(command: RemoveVideoCommand): Promise<void> {
    await this.collectionRepo.removeVideo(command.videoId, command.collectionId);
  }
}
