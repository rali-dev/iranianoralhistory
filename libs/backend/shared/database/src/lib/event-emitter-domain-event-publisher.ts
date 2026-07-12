import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IDomainEventPublisher, DomainEvent } from '@iranianoralhistory/shared-contracts';

@Injectable()
export class EventEmitterDomainEventPublisher implements IDomainEventPublisher {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  publish(event: DomainEvent): void {
    this.eventEmitter.emit(event.eventName, event);
  }
}
