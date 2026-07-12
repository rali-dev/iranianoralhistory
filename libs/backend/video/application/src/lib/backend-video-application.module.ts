import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CreateVideoHandler } from './commands/create-video.handler';
import { UpdateVideoHandler } from './commands/update-video.handler';
import { DeleteVideoHandler } from './commands/delete-video.handler';
import { CreateDocumentHandler } from './commands/create-document.handler';
import { UpdateDocumentHandler } from './commands/update-document.handler';
import { DeleteDocumentHandler } from './commands/delete-document.handler';
import { GetAllVideosHandler } from './queries/get-all-videos.handler';
import { GetVideoByIdHandler } from './queries/get-video-by-id.handler';
import { GetDocumentSignedUrlHandler } from './queries/get-document-signed-url.handler';

const COMMAND_HANDLERS = [
  CreateVideoHandler,
  UpdateVideoHandler,
  DeleteVideoHandler,
  CreateDocumentHandler,
  UpdateDocumentHandler,
  DeleteDocumentHandler,
];
const QUERY_HANDLERS = [GetAllVideosHandler, GetVideoByIdHandler, GetDocumentSignedUrlHandler];

@Module({
  imports: [CqrsModule],
  providers: [...COMMAND_HANDLERS, ...QUERY_HANDLERS],
  exports: [CqrsModule],
})
export class BackendVideoApplicationModule {}
