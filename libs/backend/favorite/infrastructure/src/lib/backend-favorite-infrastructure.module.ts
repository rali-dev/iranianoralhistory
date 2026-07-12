import { Global, Module } from '@nestjs/common';
import { FAVORITE_REPOSITORY } from '@iranianoralhistory/backend-favorite-domain';
import { PrismaFavoriteRepository } from './prisma-favorite.repository';

@Global()
@Module({
  providers: [
    PrismaFavoriteRepository,
    { provide: FAVORITE_REPOSITORY, useExisting: PrismaFavoriteRepository },
  ],
  exports: [FAVORITE_REPOSITORY],
})
export class BackendFavoriteInfrastructureModule {}
