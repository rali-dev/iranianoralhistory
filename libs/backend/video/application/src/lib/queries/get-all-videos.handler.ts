import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { IVideoRepository, VIDEO_REPOSITORY, VideoEntity } from '@iranianoralhistory/backend-video-domain';
import { GetAllVideosQuery } from './get-all-videos.query';

@Injectable()
@QueryHandler(GetAllVideosQuery)
export class GetAllVideosHandler implements IQueryHandler<GetAllVideosQuery, VideoEntity[]> {
  constructor(
    @Inject(VIDEO_REPOSITORY) private readonly videoRepo: IVideoRepository,
  ) {}

  async execute(_query: GetAllVideosQuery): Promise<VideoEntity[]> {
    return this.videoRepo.findAll();
  }
}
