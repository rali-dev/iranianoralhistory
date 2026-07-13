import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { QueryBus } from '@nestjs/cqrs';
import type { Response } from 'express';
import { JwtAuthGuard } from '@iranianoralhistory/backend-shared-auth-infra';
import { GetDocumentSignedUrlQuery } from '@iranianoralhistory/backend-video-application';

@Controller('documents')
export class DocumentController {
  constructor(private readonly queryBus: QueryBus) {}

  // Zugriffsmodell (bewusst entschieden, siehe ADR-0006):
  // Dokumente liegen in einem PRIVATEN Bucket und sind Teil des öffentlichen
  // Archivs. Jeder AUTHENTIFIZIERTE Nutzer darf eine Signed-URL für ein
  // veröffentlichtes Dokument anfordern (kein Per-Nutzer-Eigentum — Archivgut
  // ist absichtlich "öffentlich nach Login", nicht privat). Unbekannte docIds
  // liefern 404. Das enge Rate-Limit erschwert das Durchprobieren von IDs.
  // (Für künftige Admin-only-Assets zusätzlich RolesGuard + @Roles('ADMIN').)
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
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
