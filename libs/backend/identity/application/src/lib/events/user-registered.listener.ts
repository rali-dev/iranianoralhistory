import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserRegisteredEvent } from '@iranianoralhistory/backend-identity-domain';

@Injectable()
export class UserRegisteredListener {
  private readonly logger = new Logger(UserRegisteredListener.name);

  @OnEvent('user.registered')
  handle(event: UserRegisteredEvent): void {
    this.logger.log(`New user registered — id=${event.userId} email=${event.email} at=${event.occurredOn.toISOString()}`);
  }
}
