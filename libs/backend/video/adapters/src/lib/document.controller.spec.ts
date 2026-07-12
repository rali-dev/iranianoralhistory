import { DocumentController } from './document.controller';
import { GetDocumentSignedUrlQuery } from '@iranianoralhistory/backend-video-application';

const mockQueryBus = { execute: jest.fn() };

function buildController(): DocumentController {
  return new DocumentController(mockQueryBus as any);
}

function buildResponse() {
  return {
    redirect: jest.fn(),
  };
}

describe('DocumentController', () => {
  let controller: DocumentController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = buildController();
  });

  describe('getSignedUrl()', () => {
    it('dispatches GetDocumentSignedUrlQuery with the given docId', async () => {
      mockQueryBus.execute.mockResolvedValue('https://cdn.example.com/file.pdf?token=xyz');
      const res = buildResponse();

      await controller.getSignedUrl('doc-uuid-123', res as any);

      const [query] = mockQueryBus.execute.mock.calls[0];
      expect(query).toBeInstanceOf(GetDocumentSignedUrlQuery);
      expect(query.docId).toBe('doc-uuid-123');
    });

    it('redirects with status 302 to the signed URL', async () => {
      const signedUrl = 'https://cdn.example.com/file.pdf?token=xyz';
      mockQueryBus.execute.mockResolvedValue(signedUrl);
      const res = buildResponse();

      await controller.getSignedUrl('doc-abc', res as any);

      expect(res.redirect).toHaveBeenCalledWith(302, signedUrl);
    });

    it('passes different docIds correctly to the query', async () => {
      mockQueryBus.execute.mockResolvedValue('https://cdn.example.com/other.pdf?token=def');
      const res = buildResponse();

      await controller.getSignedUrl('another-doc-id', res as any);

      const [query] = mockQueryBus.execute.mock.calls[0];
      expect(query.docId).toBe('another-doc-id');
    });

    it('propagates query bus errors', async () => {
      mockQueryBus.execute.mockRejectedValue(new Error('Document not found'));
      const res = buildResponse();

      await expect(controller.getSignedUrl('missing-id', res as any)).rejects.toThrow(
        'Document not found',
      );
    });
  });
});
