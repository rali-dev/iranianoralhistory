import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { IVideoRepository, VIDEO_REPOSITORY } from '@iranianoralhistory/backend-video-domain';
import { IStorageService, STORAGE_SERVICE } from '@iranianoralhistory/backend-shared-storage';
import { GetDocumentSignedUrlQuery } from './get-document-signed-url.query';

@Injectable()
@QueryHandler(GetDocumentSignedUrlQuery)
export class GetDocumentSignedUrlHandler
  implements IQueryHandler<GetDocumentSignedUrlQuery, string>
{
  constructor(
    @Inject(VIDEO_REPOSITORY) private readonly videoRepo: IVideoRepository,
    @Inject(STORAGE_SERVICE) private readonly storageService: IStorageService,
  ) {}

  async execute(query: GetDocumentSignedUrlQuery): Promise<string> {
    const doc = await this.videoRepo.findDocumentById(query.docId);
    if (!doc) {
      throw new NotFoundException(`Dokument ${query.docId} wurde nicht gefunden`);
    }
    return this.storageService.createSignedUrl(doc.storagePath, query.expiresInSeconds);
  }
}
