export class RefreshTokensCommand {
  constructor(
    public readonly userId: string,
    public readonly incomingToken: string,
  ) {}
}
