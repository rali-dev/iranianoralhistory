import { GetAllCollectionsHandler } from './get-all-collections.handler';
import { CollectionEntity } from '@iranianoralhistory/backend-collection-domain';

function buildCollection(id = 'col-1'): CollectionEntity {
  return new CollectionEntity(
    id,
    `slug-${id}`,
    'PERSON',
    { de: 'Name DE', en: 'Name EN', fa: 'نام' },
    null,
    0,
    3,
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

describe('GetAllCollectionsHandler', () => {
  let handler: GetAllCollectionsHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new GetAllCollectionsHandler(mockCollectionRepo as any);
  });

  it('returns all collections from the repository', async () => {
    const collections = [buildCollection('col-1'), buildCollection('col-2')];
    mockCollectionRepo.findAll.mockResolvedValue(collections);

    const result = await handler.execute();

    expect(result).toBe(collections);
    expect(mockCollectionRepo.findAll).toHaveBeenCalledTimes(1);
  });

  it('returns an empty array when no collections exist', async () => {
    mockCollectionRepo.findAll.mockResolvedValue([]);

    const result = await handler.execute();

    expect(result).toEqual([]);
  });
});
