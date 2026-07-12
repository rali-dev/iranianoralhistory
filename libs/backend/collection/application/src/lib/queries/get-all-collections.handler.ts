import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  ICollectionRepository,
  COLLECTION_REPOSITORY,
  CollectionEntity,
} from '@iranianoralhistory/backend-collection-domain';
import { GetAllCollectionsQuery } from './get-all-collections.query';

@Injectable()
@QueryHandler(GetAllCollectionsQuery)
export class GetAllCollectionsHandler
  implements IQueryHandler<GetAllCollectionsQuery, CollectionEntity[]>
{
  constructor(
    @Inject(COLLECTION_REPOSITORY)
    private readonly collectionRepo: ICollectionRepository,
  ) {}

  async execute(): Promise<CollectionEntity[]> {
    return this.collectionRepo.findAll();
  }
}
