import { Logger } from '@nestjs/common';
import { UserRegisteredEvent } from '@iranianoralhistory/backend-identity-domain';
import { UserRegisteredListener } from './user-registered.listener';

describe('UserRegisteredListener', () => {
  let listener: UserRegisteredListener;
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);
    listener = new UserRegisteredListener();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('is defined', () => {
    expect(listener).toBeDefined();
  });

  it('logs the registered user id and email', () => {
    const event = new UserRegisteredEvent('user-uuid', 'new@user.de');

    listener.handle(event);

    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('id=user-uuid'),
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('email=new@user.de'),
    );
  });

  it('includes the occurredOn timestamp in the log message', () => {
    const event = new UserRegisteredEvent('user-uuid', 'new@user.de');

    listener.handle(event);

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining(event.occurredOn.toISOString()),
    );
  });
});
