import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '@iranianoralhistory/backend-shared-database';

/**
 * Betriebs-Endpunkt für Liveness/Readiness (Health-Check des Hosts,
 * Uptime-Monitoring). Öffentlich und vom Rate-Limit ausgenommen,
 * damit häufiges Polling nicht gedrosselt wird.
 *
 * Route: GET /api/health — prüft zusätzlich die DB-Erreichbarkeit (Readiness).
 * DB nicht erreichbar → 503, damit der Host die Instanz als ungesund erkennt.
 */
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check(): Promise<{ status: string; db: string; timestamp: string }> {
    const timestamp = new Date().toISOString();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException({ status: 'error', db: 'down', timestamp });
    }
    return { status: 'ok', db: 'up', timestamp };
  }
}
