import { INestApplication, ValidationPipe, VersioningType, VERSION_NEUTRAL } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { AppModule } from '../../../backend/src/app/app.module';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { parseCorsOrigins } from '../../../backend/src/config/cors-origins';
import { PrismaService, PrismaExceptionFilter } from '@iranianoralhistory/backend-shared-database';
import { DomainExceptionFilter } from '@iranianoralhistory/backend-shared-application';
import { EMAIL_SERVICE } from '@iranianoralhistory/backend-identity-domain';
import { STORAGE_SERVICE } from '@iranianoralhistory/backend-shared-storage';

export interface SentResetCode {
  to: string;
  code: string;
}

/**
 * Deterministische Signed-URL für den Test-Storage. Der echte
 * SupabaseStorageService (der ein reales Bucket bräuchte) wird ersetzt; diese
 * Formel encodiert den storagePath, damit der Signed-URL-Positivpfad end-to-end
 * (Controller → Handler → Storage-Port → 302) prüfbar ist und der Test zugleich
 * beweist, dass der KORREKTE Objektpfad an den Storage gereicht wurde.
 */
export function stubbedSignedUrl(storagePath: string, expiresInSeconds: number): string {
  return `https://storage.test/signed/${encodeURIComponent(storagePath)}?exp=${expiresInSeconds}`;
}

export interface TestApp {
  app: INestApplication;
  prisma: PrismaService;
  /**
   * Reset-Codes, die die App im Test "versendet" hätte. Der echte
   * IEmailService wird durch einen Capture-Mock ersetzt — so trifft kein Test
   * das externe Resend-API, und der Passwort-Reset-Flow ist end-to-end prüfbar,
   * weil der (sonst nur per E-Mail zugestellte) Code hier auslesbar wird.
   */
  sentResetCodes: SentResetCode[];
}

/**
 * Bootet die komplette NestJS-Anwendung in-process ohne externen Server.
 * Spiegelt den Bootstrap in main.ts VOLLSTÄNDIG wider: Prefix, helmet, CORS,
 * Cookies, globale Filter, ValidationPipe — damit auch die Transport-Härtung
 * (Security-Header, CORS) unter Test steht.
 */
export async function createTestApp(): Promise<TestApp> {
  const sentResetCodes: SentResetCode[] = [];

  const module = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(EMAIL_SERVICE)
    .useValue({
      sendPasswordResetCode: async (to: string, code: string): Promise<void> => {
        sentResetCodes.push({ to, code });
      },
    })
    .overrideProvider(STORAGE_SERVICE)
    .useValue({
      createSignedUrl: async (storagePath: string, expiresInSeconds: number): Promise<string> =>
        stubbedSignedUrl(storagePath, expiresInSeconds),
    })
    .compile();

  const app = module.createNestApplication();
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: VERSION_NEUTRAL });
  app.use(helmet());
  app.enableCors({ origin: parseCorsOrigins(process.env.CORS_ORIGINS), credentials: true });
  app.use(cookieParser());
  app.useGlobalFilters(new DomainExceptionFilter(), new PrismaExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  await app.init();

  const prisma = module.get(PrismaService);
  return { app, prisma, sentResetCodes };
}
