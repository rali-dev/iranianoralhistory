import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { IVideoRepository, VIDEO_REPOSITORY, VideoEntity } from '@iranianoralhistory/backend-video-domain';
import { GetVideoByIdQuery } from './get-video-by-id.query';

@Injectable()
@QueryHandler(GetVideoByIdQuery)
export class GetVideoByIdHandler implements IQueryHandler<GetVideoByIdQuery, VideoEntity> {
  constructor(
    @Inject(VIDEO_REPOSITORY) private readonly videoRepo: IVideoRepository,
  ) {}

  async execute(query: GetVideoByIdQuery): Promise<VideoEntity> {
    const video = await this.videoRepo.findById(query.id);
    if (!video) throw new NotFoundException(`Video ${query.id} not found`);
    return video;
  }
}
