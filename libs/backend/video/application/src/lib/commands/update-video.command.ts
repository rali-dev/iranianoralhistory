import { UpdateVideoDto } from '@iranianoralhistory/shared-contracts';

export class UpdateVideoCommand {
  constructor(
    public readonly id: string,
    public readonly dto: UpdateVideoDto,
  ) {}
}
