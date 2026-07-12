import { NotFoundException } from '@nestjs/common';
import { GetDocumentSignedUrlHandler } from './get-document-signed-url.handler';
import { GetDocumentSignedUrlQuery } from './get-document-signed-url.query';
import { DocumentEntity } from '@iranianoralhistory/backend-video-domain';

const mockDocument = new DocumentEntity('doc-uuid', 'Report.pdf', 'docs/report.pdf', 'video-uuid', new Date());

const mockVideoRepo = {
  findDocumentById: jest.fn(),
};

const mockStorageService = {
  createSignedUrl: jest.fn(),
};

describe('GetDocumentSignedUrlHandler', () => {
  let handler: GetDocumentSignedUrlHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new GetDocumentSignedUrlHandler(mockVideoRepo as any, mockStorageService as any);
  });

  it('returns a signed URL for an existing document', async () => {
    mockVideoRepo.findDocumentById.mockResolvedValue(mockDocument);
    mockStorageService.createSignedUrl.mockResolvedValue('https://storage.example.com/signed');

    const result = await handler.execute(new GetDocumentSignedUrlQuery('doc-uuid', 3600));

    expect(result).toBe('https://storage.example.com/signed');
    expect(mockStorageService.createSignedUrl).toHaveBeenCalledWith('docs/report.pdf', 3600);
  });

  it('uses the default expiry (3600 s) when not provided', async () => {
    mockVideoRepo.findDocumentById.mockResolvedValue(mockDocument);
    mockStorageService.createSignedUrl.mockResolvedValue('https://storage.example.com/signed');

    await handler.execute(new GetDocumentSignedUrlQuery('doc-uuid'));

    expect(mockStorageService.createSignedUrl).toHaveBeenCalledWith('docs/report.pdf', 3600);
  });

  it('throws NotFoundException when the document does not exist', async () => {
    mockVideoRepo.findDocumentById.mockResolvedValue(null);

    await expect(
      handler.execute(new GetDocumentSignedUrlQuery('missing-doc')),
    ).rejects.toThrow(NotFoundException);

    expect(mockStorageService.createSignedUrl).not.toHaveBeenCalled();
  });
});
