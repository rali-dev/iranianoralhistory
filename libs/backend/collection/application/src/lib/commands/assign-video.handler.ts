import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  ICollectionRepository,
  COLLECTION_REPOSITORY,
} from '@iranianoralhistory/backend-collection-domain';
import { AssignVideoCommand } from './assign-video.command';

@Injectable()
@CommandHandler(AssignVideoCommand)
export class AssignVideoHandler implements ICommandHandler<AssignVideoCommand, void> {
  constructor(
    @Inject(COLLECTION_REPOSITORY)
    private readonly collectionRepo: ICollectionRepository,
  ) {}

  async execute(command: AssignVideoCommand): Promise<void> {
    await this.collectionRepo.assignVideo(command.videoId, command.collectionId);
  }
}
