import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { BackendSharedDatabaseModule } from '@iranianoralhistory/backend-shared-database';
import { BackendSharedStorageModule } from '@iranianoralhistory/backend-shared-storage';
import { BackendIdentityInfrastructureModule } from '@iranianoralhistory/backend-identity-infrastructure';
import { BackendVideoInfrastructureModule } from '@iranianoralhistory/backend-video-infrastructure';
import { BackendCollectionInfrastructureModule } from '@iranianoralhistory/backend-collection-infrastructure';
import { BackendIdentityAdaptersModule } from '@iranianoralhistory/backend-identity-adapters';
import { BackendVideoAdaptersModule } from '@iranianoralhistory/backend-video-adapters';
import { BackendCollectionAdaptersModule } from '@iranianoralhistory/backend-collection-adapters';
import { BackendFavoriteInfrastructureModule } from '@iranianoralhistory/backend-favorite-infrastructure';
import { BackendFavoriteAdaptersModule } from '@iranianoralhistory/backend-favorite-adapters';

@Module({
  imports: [
    // Zentrale Konfiguration: liest .env, global injizierbar via ConfigService.
    // Kein validate() hier — die Fail-fast-Prüfung bleibt in main.ts (validateEnv),
    // damit Tests das AppModule mit partieller Env booten können.
    ConfigModule.forRoot({ isGlobal: true, cache: true }),
    EventEmitterModule.forRoot(),
    // Globales Rate-Limiting: 100 Requests pro Minute je IP (bremst Brute-Force /
    // Credential-Stuffing). Sensible Endpunkte können per @Throttle() verschärft werden.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    BackendSharedDatabaseModule,
    BackendSharedStorageModule,
    BackendIdentityInfrastructureModule,
    BackendVideoInfrastructureModule,
    BackendCollectionInfrastructureModule,
    BackendFavoriteInfrastructureModule,
    BackendIdentityAdaptersModule,
    BackendVideoAdaptersModule,
    BackendCollectionAdaptersModule,
    BackendFavoriteAdaptersModule,
  ],
  providers: [
    // ThrottlerGuard global registrieren — schützt alle Routen.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
