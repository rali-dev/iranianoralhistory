import { Global, Module } from '@nestjs/common';
import { COLLECTION_REPOSITORY } from '@iranianoralhistory/backend-collection-domain';
import { PrismaCollectionRepository } from './prisma-collection.repository';

@Global()
@Module({
  providers: [
    PrismaCollectionRepository,
    { provide: COLLECTION_REPOSITORY, useExisting: PrismaCollectionRepository },
  ],
  exports: [COLLECTION_REPOSITORY],
})
export class BackendCollectionInfrastructureModule {}
