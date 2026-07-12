import { Global, Module } from '@nestjs/common';
import { DOMAIN_EVENT_PUBLISHER } from '@iranianoralhistory/shared-contracts';
import { PrismaService } from './prisma.service';
import { EventEmitterDomainEventPublisher } from './event-emitter-domain-event-publisher';

@Global()
@Module({
  providers: [
    PrismaService,
    EventEmitterDomainEventPublisher,
    { provide: DOMAIN_EVENT_PUBLISHER, useExisting: EventEmitterDomainEventPublisher },
  ],
  exports: [PrismaService, DOMAIN_EVENT_PUBLISHER],
})
export class BackendSharedDatabaseModule {}
