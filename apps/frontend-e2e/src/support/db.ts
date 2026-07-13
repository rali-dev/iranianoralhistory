import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { config } from 'dotenv';
import { resolve } from 'path';

/**
 * Direkter DB-Zugriff für E2E-Setup/Teardown. Der Seed legt keine Nutzer an und
 * es gibt keinen API-Endpunkt zum Hochstufen — daher promoten wir einen frisch
 * registrierten Nutzer hier direkt zu ADMIN (wie prisma/seed.ts). Läuft im
 * Node-Kontext des Tests, getrennt vom Browser.
 */
config({ path: resolve(__dirname, '../../../../.env') });

function client(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL'] ?? '' });
  return new PrismaClient({ adapter });
}

async function withPrisma<T>(fn: (prisma: PrismaClient) => Promise<T>): Promise<T> {
  const prisma = client();
  try {
    return await fn(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

export function promoteToAdmin(email: string): Promise<unknown> {
  return withPrisma((prisma) => prisma.user.update({ where: { email }, data: { role: 'ADMIN' } }));
}

export function deleteUser(email: string): Promise<unknown> {
  return withPrisma((prisma) => prisma.user.deleteMany({ where: { email } }));
}

export function deleteVideoByVimeoId(vimeoId: string): Promise<unknown> {
  return withPrisma((prisma) => prisma.video.deleteMany({ where: { vimeoId } }));
}
