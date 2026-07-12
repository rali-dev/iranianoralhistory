import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import type { Response } from 'express';
import { JwtAuthGuard } from '@iranianoralhistory/backend-shared-auth-infra';
import { GetDocumentSignedUrlQuery } from '@iranianoralhistory/backend-video-application';

@Controller('documents')
export class DocumentController {
  constructor(private readonly queryBus: QueryBus) {}

  // Dokumente liegen in einem privaten Bucket. Nur authentifizierte Nutzer
  // dürfen eine Signed-URL anfordern — sonst wäre jedes Dokument über die
  // öffentlich gelisteten docIds anonym abrufbar.
  // (Für Admin-only Dokumente zusätzlich RolesGuard + @Roles('ADMIN') ergänzen.)
  @UseGuards(JwtAuthGuard)
  @Get(':docId/signed-url')
  async getSignedUrl(
    @Param('docId') docId: string,
    @Res() res: Response,
  ): Promise<void> {
    const signedUrl: string = await this.queryBus.execute(
      new GetDocumentSignedUrlQuery(docId),
    );
    res.redirect(302, signedUrl);
  }
}
