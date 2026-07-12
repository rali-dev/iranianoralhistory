import { DeleteDocumentHandler } from './delete-document.handler';
import { DeleteDocumentCommand } from './delete-document.command';

const mockVideoRepo = {
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  addDocument: jest.fn(),
  updateDocument: jest.fn(),
  deleteDocument: jest.fn(),
  findDocumentById: jest.fn(),
};

const mockLogger = { log: jest.fn() };

describe('DeleteDocumentHandler', () => {
  let handler: DeleteDocumentHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new DeleteDocumentHandler(mockVideoRepo as any);
    (handler as any).logger = mockLogger;
  });

  it('deletes the document by id', async () => {
    mockVideoRepo.deleteDocument.mockResolvedValue(undefined);

    await handler.execute(new DeleteDocumentCommand('doc-uuid'));

    expect(mockVideoRepo.deleteDocument).toHaveBeenCalledWith('doc-uuid');
  });

  it('returns void on success', async () => {
    mockVideoRepo.deleteDocument.mockResolvedValue(undefined);

    const result = await handler.execute(new DeleteDocumentCommand('doc-uuid'));

    expect(result).toBeUndefined();
  });
});
