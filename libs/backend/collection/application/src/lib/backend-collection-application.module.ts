import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { GetAllCollectionsHandler } from './queries/get-all-collections.handler';
import { CreateCollectionHandler } from './commands/create-collection.handler';
import { UpdateCollectionHandler } from './commands/update-collection.handler';
import { DeleteCollectionHandler } from './commands/delete-collection.handler';
import { AssignVideoHandler } from './commands/assign-video.handler';
import { RemoveVideoHandler } from './commands/remove-video.handler';

const QUERY_HANDLERS = [GetAllCollectionsHandler];
const COMMAND_HANDLERS = [
  CreateCollectionHandler,
  UpdateCollectionHandler,
  DeleteCollectionHandler,
  AssignVideoHandler,
  RemoveVideoHandler,
];

@Module({
  imports: [CqrsModule],
  providers: [...QUERY_HANDLERS, ...COMMAND_HANDLERS],
  exports: [CqrsModule],
})
export class BackendCollectionApplicationModule {}
