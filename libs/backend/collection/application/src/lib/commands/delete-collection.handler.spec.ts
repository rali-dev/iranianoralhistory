import { DeleteCollectionHandler } from './delete-collection.handler';
import { DeleteCollectionCommand } from './delete-collection.command';

const mockCollectionRepo = {
  findAll: jest.fn(),
  findBySlug: jest.fn(),
  findByType: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  assignVideo: jest.fn(),
  removeVideo: jest.fn(),
};

const mockLogger = { log: jest.fn() };

describe('DeleteCollectionHandler', () => {
  let handler: DeleteCollectionHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new DeleteCollectionHandler(mockCollectionRepo as any);
    (handler as any).logger = mockLogger;
  });

  it('calls repo.delete with the correct id', async () => {
    mockCollectionRepo.delete.mockResolvedValue(undefined);

    await handler.execute(new DeleteCollectionCommand('col-uuid'));

    expect(mockCollectionRepo.delete).toHaveBeenCalledWith('col-uuid');
  });

  it('returns void on success', async () => {
    mockCollectionRepo.delete.mockResolvedValue(undefined);

    const result = await handler.execute(new DeleteCollectionCommand('col-uuid'));

    expect(result).toBeUndefined();
  });
});
