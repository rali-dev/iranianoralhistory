import { Inject, Injectable, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ICollectionRepository, COLLECTION_REPOSITORY } from '@iranianoralhistory/backend-collection-domain';
import { DeleteCollectionCommand } from './delete-collection.command';

@Injectable()
@CommandHandler(DeleteCollectionCommand)
export class DeleteCollectionHandler implements ICommandHandler<DeleteCollectionCommand, void> {
  private readonly logger = new Logger(DeleteCollectionHandler.name);

  constructor(
    @Inject(COLLECTION_REPOSITORY) private readonly collectionRepo: ICollectionRepository,
  ) {}

  async execute(command: DeleteCollectionCommand): Promise<void> {
    await this.collectionRepo.delete(command.id);
    this.logger.log(`Collection deleted: ${command.id}`);
  }
}
