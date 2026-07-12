export class GetDocumentSignedUrlQuery {
  constructor(
    public readonly docId: string,
    public readonly expiresInSeconds = 3600,
  ) {}
}
