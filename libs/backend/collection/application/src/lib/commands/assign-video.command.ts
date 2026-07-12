export class AssignVideoCommand {
  constructor(
    public readonly collectionId: string,
    public readonly videoId: string,
  ) {}
}
