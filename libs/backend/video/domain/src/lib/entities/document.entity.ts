export class DocumentEntity {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly storagePath: string,
    public readonly videoId: string,
    public readonly createdAt: Date,
  ) {}
}
