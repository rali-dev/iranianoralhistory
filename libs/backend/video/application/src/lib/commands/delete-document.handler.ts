import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IVideoRepository, VIDEO_REPOSITORY } from '@iranianoralhistory/backend-video-domain';
import { BaseCommandHandler } from '@iranianoralhistory/backend-shared-application';
import { DeleteDocumentCommand } from './delete-document.command';

@Injectable()
@CommandHandler(DeleteDocumentCommand)
export class DeleteDocumentHandler
  extends BaseCommandHandler<DeleteDocumentCommand, void>
  implements ICommandHandler<DeleteDocumentCommand, void>
{
  constructor(
    @Inject(VIDEO_REPOSITORY) private readonly videoRepo: IVideoRepository,
  ) {
    super(DeleteDocumentHandler.name);
  }

  async execute(command: DeleteDocumentCommand): Promise<void> {
    await this.videoRepo.deleteDocument(command.docId);
    this.logger.log(`Document deleted: ${command.docId}`);
  }
}
