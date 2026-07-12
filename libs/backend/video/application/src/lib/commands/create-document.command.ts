import { CreateDocumentInput } from '@iranianoralhistory/backend-video-domain';

export class CreateDocumentCommand {
  constructor(public readonly data: CreateDocumentInput) {}
}
