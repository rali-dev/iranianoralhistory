import { Module } from '@nestjs/common';
import { BackendSharedAuthInfraModule } from '@iranianoralhistory/backend-shared-auth-infra';
import { BackendCollectionApplicationModule } from '@iranianoralhistory/backend-collection-application';
import { CollectionController } from './collection.controller';

@Module({
  imports: [BackendSharedAuthInfraModule, BackendCollectionApplicationModule],
  controllers: [CollectionController],
})
export class BackendCollectionAdaptersModule {}
