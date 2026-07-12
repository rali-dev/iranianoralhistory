import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  ICollectionRepository,
  COLLECTION_REPOSITORY,
  CollectionEntity,
} from '@iranianoralhistory/backend-collection-domain';
import { UpdateCollectionCommand } from './update-collection.command';

@Injectable()
@CommandHandler(UpdateCollectionCommand)
export class UpdateCollectionHandler implements ICommandHandler<UpdateCollectionCommand, CollectionEntity> {
  private readonly logger = new Logger(UpdateCollectionHandler.name);

  constructor(
    @Inject(COLLECTION_REPOSITORY) private readonly collectionRepo: ICollectionRepository,
  ) {}

  async execute(command: UpdateCollectionCommand): Promise<CollectionEntity> {
    const collection = await this.collectionRepo.update(command.id, command.dto);
    this.logger.log(`Collection updated: ${collection.id}`);
    return collection;
  }
}
