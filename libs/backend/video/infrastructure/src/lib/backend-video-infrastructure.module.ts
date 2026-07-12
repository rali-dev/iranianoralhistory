import { Global, Module } from '@nestjs/common';
import { VIDEO_REPOSITORY } from '@iranianoralhistory/backend-video-domain';
import { PrismaVideoRepository } from './prisma-video.repository';

@Global()
@Module({
  providers: [
    PrismaVideoRepository,
    { provide: VIDEO_REPOSITORY, useExisting: PrismaVideoRepository },
  ],
  exports: [VIDEO_REPOSITORY],
})
export class BackendVideoInfrastructureModule {}
