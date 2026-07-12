import { EventEmitter2 } from '@nestjs/event-emitter';
import { DomainEvent } from '@iranianoralhistory/shared-contracts';
import { EventEmitterDomainEventPublisher } from './event-emitter-domain-event-publisher';

class TestEvent extends DomainEvent {
  readonly eventName = 'test.happened';
  constructor(public readonly payload: string) {
    super();
  }
}

describe('EventEmitterDomainEventPublisher', () => {
  let emitter: { emit: jest.Mock };
  let publisher: EventEmitterDomainEventPublisher;

  beforeEach(() => {
    emitter = { emit: jest.fn() };
    publisher = new EventEmitterDomainEventPublisher(emitter as unknown as EventEmitter2);
  });

  it('emits on the event topic named after eventName, passing the event as payload', () => {
    const event = new TestEvent('hello');

    publisher.publish(event);

    expect(emitter.emit).toHaveBeenCalledTimes(1);
    expect(emitter.emit).toHaveBeenCalledWith('test.happened', event);
  });

  it('uses each event’s own eventName as the topic (no hard-coded channel)', () => {
    class OtherEvent extends DomainEvent {
      readonly eventName = 'other.thing';
    }
    const event = new OtherEvent();

    publisher.publish(event);

    expect(emitter.emit).toHaveBeenCalledWith('other.thing', event);
  });
});
