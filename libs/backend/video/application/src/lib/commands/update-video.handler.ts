import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IVideoRepository, VIDEO_REPOSITORY, VideoEntity, VimeoId } from '@iranianoralhistory/backend-video-domain';
import { BaseCommandHandler, mustExist } from '@iranianoralhistory/backend-shared-application';
import { UpdateVideoCommand } from './update-video.command';

@Injectable()
@CommandHandler(UpdateVideoCommand)
export class UpdateVideoHandler
  extends BaseCommandHandler<UpdateVideoCommand, VideoEntity>
  implements ICommandHandler<UpdateVideoCommand, VideoEntity>
{
  constructor(
    @Inject(VIDEO_REPOSITORY) private readonly videoRepo: IVideoRepository,
  ) {
    super(UpdateVideoHandler.name);
  }

  async execute(command: UpdateVideoCommand): Promise<VideoEntity> {
    await mustExist(this.videoRepo.findById(command.id), 'Video', command.id);

    // Validate & normalize the Vimeo ID through the value object (as the create path does),
    // so a malformed id is rejected as a domain error (400) before it reaches persistence
    // and the stored value is trimmed identically to a freshly created one.
    const { dto } = command;
    const normalizedDto =
      dto.vimeoId !== undefined
        ? { ...dto, vimeoId: VimeoId.create(dto.vimeoId).toString() }
        : dto;

    const video = await this.videoRepo.update(command.id, normalizedDto);
    this.logger.log(`Video updated: ${video.id}`);
    return video;
  }
}
