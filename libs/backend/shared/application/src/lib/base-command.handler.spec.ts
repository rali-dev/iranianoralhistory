import { Logger } from '@nestjs/common';
import { BaseCommandHandler } from './base-command.handler';

interface DoubleCommand {
  value: number;
}

class DoubleHandler extends BaseCommandHandler<DoubleCommand, number> {
  constructor() {
    super(DoubleHandler.name);
  }

  async execute(command: DoubleCommand): Promise<number> {
    this.logger.log(`doubling ${command.value}`);
    return command.value * 2;
  }
}

function loggerOf(handler: BaseCommandHandler<unknown, unknown>): Logger {
  return (handler as unknown as { logger: Logger }).logger;
}

describe('BaseCommandHandler', () => {
  // Die einzige echte Verhaltensweise der Basisklasse ist, den geschützten
  // Logger nach dem KONKRETEN Handler zu benennen — genau das wird hier geprüft,
  // nicht nur `instanceof`.
  it('names the protected Logger after the concrete subclass', () => {
    const logger = loggerOf(new DoubleHandler());

    expect(logger).toBeInstanceOf(Logger);
    expect((logger as unknown as { context?: string }).context).toBe('DoubleHandler');
  });

  it('exposes that Logger to the subclass (the subclass logs THROUGH the base logger)', async () => {
    const handler = new DoubleHandler();
    const logSpy = jest.spyOn(loggerOf(handler), 'log').mockImplementation(() => undefined);

    const result = await handler.execute({ value: 21 });

    // Der Rückgabewert ist nebensächlich; entscheidend ist, dass execute() den
    // von der Basisklasse bereitgestellten Logger tatsächlich benutzen kann.
    expect(result).toBe(42);
    expect(logSpy).toHaveBeenCalledWith('doubling 21');
  });
});
