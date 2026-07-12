import { Logger } from '@nestjs/common';

export abstract class BaseCommandHandler<TCommand, TResult = void> {
  protected readonly logger: Logger;

  constructor(handlerName: string) {
    this.logger = new Logger(handlerName);
  }

  abstract execute(command: TCommand): Promise<TResult>;
}
