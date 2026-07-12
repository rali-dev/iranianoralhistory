import { CreateCollectionDto } from '@iranianoralhistory/shared-contracts';

export class CreateCollectionCommand {
  constructor(public readonly dto: CreateCollectionDto) {}
}
