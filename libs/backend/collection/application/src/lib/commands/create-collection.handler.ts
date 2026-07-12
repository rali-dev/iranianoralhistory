import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  ICollectionRepository,
  COLLECTION_REPOSITORY,
  CollectionEntity,
} from '@iranianoralhistory/backend-collection-domain';
import { CreateCollectionCommand } from './create-collection.command';

@Injectable()
@CommandHandler(CreateCollectionCommand)
export class CreateCollectionHandler
  implements ICommandHandler<CreateCollectionCommand, CollectionEntity>
{
  constructor(
    @Inject(COLLECTION_REPOSITORY)
    private readonly collectionRepo: ICollectionRepository,
  ) {}

  async execute(command: CreateCollectionCommand): Promise<CollectionEntity> {
    const { dto } = command;
    return this.collectionRepo.create({
      slug: dto.slug,
      type: dto.type,
      name: dto.name,
      description: dto.description ?? null,
      sortOrder: dto.sortOrder ?? 0,
    });
  }
}
