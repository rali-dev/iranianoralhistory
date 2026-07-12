import { UpdateCollectionDto } from '@iranianoralhistory/shared-contracts';

export class UpdateCollectionCommand {
  constructor(
    public readonly id: string,
    public readonly dto: UpdateCollectionDto,
  ) {}
}
