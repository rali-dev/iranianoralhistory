import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IVideoRepository, VIDEO_REPOSITORY } from '@iranianoralhistory/backend-video-domain';
import { BaseCommandHandler, mustExist } from '@iranianoralhistory/backend-shared-application';
import { DeleteVideoCommand } from './delete-video.command';

@Injectable()
@CommandHandler(DeleteVideoCommand)
export class DeleteVideoHandler
  extends BaseCommandHandler<DeleteVideoCommand, void>
  implements ICommandHandler<DeleteVideoCommand, void>
{
  constructor(
    @Inject(VIDEO_REPOSITORY) private readonly videoRepo: IVideoRepository,
  ) {
    super(DeleteVideoHandler.name);
  }

  async execute(command: DeleteVideoCommand): Promise<void> {
    await mustExist(this.videoRepo.findById(command.id), 'Video', command.id);
    await this.videoRepo.delete(command.id);
    this.logger.log(`Video deleted: ${command.id}`);
  }
}
