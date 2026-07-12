import { UserCrudController } from './user-crud.controller';

const mockQueryBus = { execute: jest.fn() };

function buildController(): UserCrudController {
  return new UserCrudController(mockQueryBus as any);
}

describe('UserCrudController', () => {
  let controller: UserCrudController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = buildController();
  });

  describe('getMe()', () => {
    it('dispatches GetMeQuery with the user id from the JWT payload', () => {
      const mockUser = { id: 'user-uuid', email: 'u@t.de', role: 'USER' };
      mockQueryBus.execute.mockResolvedValue(mockUser);
      const req = { user: { id: 'user-uuid', email: 'u@t.de', role: 'USER' } };

      controller.getMe(req as any);

      const [query] = mockQueryBus.execute.mock.calls[0];
      expect(query.constructor.name).toBe('GetMeQuery');
      expect(query.userId).toBe('user-uuid');
    });

    it('returns the result from the query bus', async () => {
      const profile = { id: 'user-uuid', email: 'u@t.de', role: 'USER' };
      mockQueryBus.execute.mockResolvedValue(profile);
      const req = { user: { id: 'user-uuid' } };

      const result = await controller.getMe(req as any);

      expect(result).toEqual(profile);
    });
  });
});
