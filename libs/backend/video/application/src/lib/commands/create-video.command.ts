import { CreateVideoDto } from '@iranianoralhistory/shared-contracts';

export class CreateVideoCommand {
  constructor(public readonly dto: CreateVideoDto) {}
}
