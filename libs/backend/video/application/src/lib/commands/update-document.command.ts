import { UpdateDocumentDto } from '@iranianoralhistory/shared-contracts';

export class UpdateDocumentCommand {
  constructor(
    public readonly docId: string,
    public readonly dto: UpdateDocumentDto,
  ) {}
}
