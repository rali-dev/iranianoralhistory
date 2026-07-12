import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IVideoRepository, VIDEO_REPOSITORY, DocumentEntity } from '@iranianoralhistory/backend-video-domain';
import { BaseCommandHandler } from '@iranianoralhistory/backend-shared-application';
import { UpdateDocumentCommand } from './update-document.command';

@Injectable()
@CommandHandler(UpdateDocumentCommand)
export class UpdateDocumentHandler
  extends BaseCommandHandler<UpdateDocumentCommand, DocumentEntity>
  implements ICommandHandler<UpdateDocumentCommand, DocumentEntity>
{
  constructor(
    @Inject(VIDEO_REPOSITORY) private readonly videoRepo: IVideoRepository,
  ) {
    super(UpdateDocumentHandler.name);
  }

  async execute(command: UpdateDocumentCommand): Promise<DocumentEntity> {
    const doc = await this.videoRepo.updateDocument(command.docId, command.dto);
    this.logger.log(`Document updated: ${doc.id}`);
    return doc;
  }
}
