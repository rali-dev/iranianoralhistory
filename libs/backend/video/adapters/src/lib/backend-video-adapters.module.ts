import { Module } from '@nestjs/common';
import { BackendSharedAuthInfraModule } from '@iranianoralhistory/backend-shared-auth-infra';
import { BackendVideoApplicationModule } from '@iranianoralhistory/backend-video-application';
import { VideoController } from './video.controller';
import { DocumentController } from './document.controller';

@Module({
  imports: [BackendSharedAuthInfraModule, BackendVideoApplicationModule],
  controllers: [VideoController, DocumentController],
})
export class BackendVideoAdaptersModule {}
