import { UpdateCollectionHandler } from './update-collection.handler';
import { UpdateCollectionCommand } from './update-collection.command';
import { CollectionEntity } from '@iranianoralhistory/backend-collection-domain';

function buildCollection(): CollectionEntity {
  return new CollectionEntity(
    'col-uuid',
    'updated-slug',
    'TOPIC',
    { de: 'Neu', en: 'New', fa: 'جدید' },
    null,
    2,
    0,
    new Date(),
    new Date(),
  );
}

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

describe('UpdateCollectionHandler', () => {
  let handler: UpdateCollectionHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new UpdateCollectionHandler(mockCollectionRepo as any);
    (handler as any).logger = mockLogger;
  });

  it('calls repo.update with the correct id and dto and returns the result', async () => {
    const updated = buildCollection();
    mockCollectionRepo.update.mockResolvedValue(updated);

    const result = await handler.execute(
      new UpdateCollectionCommand('col-uuid', { sortOrder: 2 }),
    );

    expect(result).toBe(updated);
    expect(mockCollectionRepo.update).toHaveBeenCalledWith('col-uuid', { sortOrder: 2 });
  });
});
