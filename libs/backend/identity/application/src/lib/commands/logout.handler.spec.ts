import { LogoutHandler } from './logout.handler';
import { LogoutCommand } from './logout.command';

const mockUserRepo = {
  updateRefreshToken: jest.fn(),
};

describe('LogoutHandler', () => {
  let handler: LogoutHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new LogoutHandler(mockUserRepo as any);
  });

  it('nullifies the refresh token to invalidate the session', async () => {
    mockUserRepo.updateRefreshToken.mockResolvedValue(undefined);

    await handler.execute(new LogoutCommand('user-uuid-1'));

    expect(mockUserRepo.updateRefreshToken).toHaveBeenCalledWith('user-uuid-1', null);
    expect(mockUserRepo.updateRefreshToken).toHaveBeenCalledTimes(1);
  });

  it('is always called with the correct userId', async () => {
    mockUserRepo.updateRefreshToken.mockResolvedValue(undefined);
    const userId = 'different-user-id';

    await handler.execute(new LogoutCommand(userId));

    expect(mockUserRepo.updateRefreshToken).toHaveBeenCalledWith(userId, null);
  });
});
