import { DomainEvent } from '@iranianoralhistory/shared-contracts';

export class UserRegisteredEvent extends DomainEvent {
  readonly eventName: string = 'user.registered';

  constructor(
    public readonly userId: string,
    public readonly email: string,
  ) {
    super();
  }
}
