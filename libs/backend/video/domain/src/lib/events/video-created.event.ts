import { DomainEvent } from '@iranianoralhistory/shared-contracts';

export class VideoCreatedEvent extends DomainEvent {
  readonly eventName: string = 'video.created';

  constructor(
    public readonly videoId: string,
    public readonly vimeoId: string,
  ) {
    super();
  }
}
