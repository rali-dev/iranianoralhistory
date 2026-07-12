import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  IVideoRepository,
  VIDEO_REPOSITORY,
  DocumentEntity,
} from '@iranianoralhistory/backend-video-domain';
import { mustExist } from '@iranianoralhistory/backend-shared-application';
import { CreateDocumentCommand } from './create-document.command';

@Injectable()
@CommandHandler(CreateDocumentCommand)
export class CreateDocumentHandler
  implements ICommandHandler<CreateDocumentCommand, DocumentEntity>
{
  constructor(
    @Inject(VIDEO_REPOSITORY) private readonly videoRepo: IVideoRepository,
  ) {}

  async execute(command: CreateDocumentCommand): Promise<DocumentEntity> {
    await mustExist(
      this.videoRepo.findById(command.data.videoId),
      'Video',
      command.data.videoId,
    );
    return this.videoRepo.addDocument(command.data);
  }
}
