import { Controller, Get, Param, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { QueryBus } from '@nestjs/cqrs';
import type { Response } from 'express';
import { GetDocumentSignedUrlQuery } from '@iranianoralhistory/backend-video-application';

@Controller('documents')
export class DocumentController {
  constructor(private readonly queryBus: QueryBus) {}

  // Zugriffsmodell (bewusst entschieden, siehe ADR-0008; ersetzt ADR-0006):
  // Dokumente sind Teil des ÖFFENTLICHEN Archivs und werden — wie die Videos
  // (öffentliche Vimeo-Embeds) — OHNE Login ausgeliefert (kein JwtAuthGuard).
  // Die Datei selbst bleibt in einem PRIVATEN Bucket; öffentlich ist nur die
  // kurzlebige Signed-URL (Default 3600s). Missbrauchsschutz: nicht-ratbare
  // UUID-docIds, das enge Rate-Limit unten erschwert das Durchprobieren, und
  // unbekannte docIds liefern 404. (Für künftige Admin-only-Assets zusätzlich
  // JwtAuthGuard + RolesGuard + @Roles('ADMIN').)
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
