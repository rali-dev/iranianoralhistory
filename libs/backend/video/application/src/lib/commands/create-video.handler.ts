import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  IVideoRepository,
  VIDEO_REPOSITORY,
  VideoEntity,
  VimeoId,
  VideoCreatedEvent,
} from '@iranianoralhistory/backend-video-domain';
import {
  IDomainEventPublisher,
  DOMAIN_EVENT_PUBLISHER,
} from '@iranianoralhistory/shared-contracts';
import { BaseCommandHandler } from '@iranianoralhistory/backend-shared-application';
import { CreateVideoCommand } from './create-video.command';

@Injectable()
@CommandHandler(CreateVideoCommand)
export class CreateVideoHandler
  extends BaseCommandHandler<CreateVideoCommand, VideoEntity>
  implements ICommandHandler<CreateVideoCommand, VideoEntity>
{
  constructor(
    @Inject(VIDEO_REPOSITORY) private readonly videoRepo: IVideoRepository,
    @Inject(DOMAIN_EVENT_PUBLISHER) private readonly eventPublisher: IDomainEventPublisher,
  ) {
    super(CreateVideoHandler.name);
  }

  async execute(command: CreateVideoCommand): Promise<VideoEntity> {
    const vimeoId = VimeoId.create(command.dto.vimeoId);
    const video = await this.videoRepo.create({
      vimeoId,
      title: command.dto.title,
      description: command.dto.description ?? null,
    });

    this.logger.log(`Video created: ${video.id}`);
    this.eventPublisher.publish(new VideoCreatedEvent(video.id, vimeoId.toString()));

    return video;
  }
}
