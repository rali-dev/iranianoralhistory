import { Module } from '@nestjs/common';
import { BackendSharedAuthInfraModule } from '@iranianoralhistory/backend-shared-auth-infra';
import { BackendFavoriteApplicationModule } from '@iranianoralhistory/backend-favorite-application';
import { FavoriteController } from './favorite.controller';

@Module({
  imports: [BackendSharedAuthInfraModule, BackendFavoriteApplicationModule],
  controllers: [FavoriteController],
})
export class BackendFavoriteAdaptersModule {}
