export class RemoveVideoCommand {
  constructor(
    public readonly collectionId: string,
    public readonly videoId: string,
  ) {}
}
