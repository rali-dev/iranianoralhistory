import { CreateCollectionHandler } from './create-collection.handler';
import { CreateCollectionCommand } from './create-collection.command';
import { CollectionEntity } from '@iranianoralhistory/backend-collection-domain';

function buildCollection(): CollectionEntity {
  return new CollectionEntity(
    'col-uuid',
    'person-ali',
    'PERSON',
    { de: 'Ali', en: 'Ali', fa: 'علی' },
    null,
    0,
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

describe('CreateCollectionHandler', () => {
  let handler: CreateCollectionHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new CreateCollectionHandler(mockCollectionRepo as any);
  });

  it('creates and returns the new collection', async () => {
    const collection = buildCollection();
    mockCollectionRepo.create.mockResolvedValue(collection);

    const result = await handler.execute(
      new CreateCollectionCommand({
        slug: 'person-ali',
        type: 'PERSON',
        name: { de: 'Ali', en: 'Ali', fa: 'علی' },
      }),
    );

    expect(result).toBe(collection);
    expect(mockCollectionRepo.create).toHaveBeenCalledWith({
      slug: 'person-ali',
      type: 'PERSON',
      name: { de: 'Ali', en: 'Ali', fa: 'علی' },
      description: null,
      sortOrder: 0,
    });
  });

  it('uses provided sortOrder when given', async () => {
    mockCollectionRepo.create.mockResolvedValue(buildCollection());

    await handler.execute(
      new CreateCollectionCommand({
        slug: 'topic-iran',
        type: 'TOPIC',
        name: { de: 'Iran', en: 'Iran', fa: 'ایران' },
        sortOrder: 5,
      }),
    );

    expect(mockCollectionRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ sortOrder: 5 }),
    );
  });

  it('passes description when provided', async () => {
    mockCollectionRepo.create.mockResolvedValue(buildCollection());

    await handler.execute(
      new CreateCollectionCommand({
        slug: 'person-x',
        type: 'PERSON',
        name: { de: 'X', en: 'X', fa: 'ایکس' },
        description: { de: 'Beschr.', en: 'Desc', fa: 'توضیح' },
      }),
    );

    expect(mockCollectionRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        description: { de: 'Beschr.', en: 'Desc', fa: 'توضیح' },
      }),
    );
  });
});
