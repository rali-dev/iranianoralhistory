import { UpdateDocumentHandler } from './update-document.handler';
import { UpdateDocumentCommand } from './update-document.command';
import { DocumentEntity } from '@iranianoralhistory/backend-video-domain';

function buildDocument(): DocumentEntity {
  return new DocumentEntity('doc-uuid', 'Updated.pdf', 'docs/updated.pdf', 'video-uuid', new Date());
}

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

describe('UpdateDocumentHandler', () => {
  let handler: UpdateDocumentHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new UpdateDocumentHandler(mockVideoRepo as any);
    (handler as any).logger = mockLogger;
  });

  it('updates and returns the document', async () => {
    const doc = buildDocument();
    mockVideoRepo.updateDocument.mockResolvedValue(doc);

    const result = await handler.execute(
      new UpdateDocumentCommand('doc-uuid', { title: 'Updated.pdf' }),
    );

    expect(result).toBe(doc);
    expect(mockVideoRepo.updateDocument).toHaveBeenCalledWith('doc-uuid', { title: 'Updated.pdf' });
  });
});
