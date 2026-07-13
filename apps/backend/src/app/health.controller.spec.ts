// Stubbt die DB-Lib, damit der Unit-Test nicht den echten pg/Prisma-Treiber lädt
// (der im Jest-Node-Env sonst an fehlendem TextEncoder scheitert). Der Controller
// bekommt seinen Prisma-Doppelgänger ohnehin per Konstruktor injiziert.
jest.mock('@iranianoralhistory/backend-shared-database', () => ({
  PrismaService: class {},
}));

import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let prisma: { $queryRaw: jest.Mock };
  let controller: HealthController;

  beforeEach(() => {
    prisma = { $queryRaw: jest.fn() };
    controller = new HealthController(prisma as any);
  });

  it('reports ok and pings the database when reachable', async () => {
    prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

    const result = await controller.check();

    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
    expect(result.status).toBe('ok');
    expect(result.db).toBe('up');
    expect(typeof result.timestamp).toBe('string');
  });

  it('throws 503 (ServiceUnavailable) when the database is unreachable', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('connection refused'));

    await expect(controller.check()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
