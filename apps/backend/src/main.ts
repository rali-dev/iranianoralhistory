import { Logger, ValidationPipe, VersioningType, VERSION_NEUTRAL } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app/app.module';
import { validateEnv } from './config/validate-env';
import { parseCorsOrigins } from './config/cors-origins';
import cookieParser from 'cookie-parser';
import { DomainExceptionFilter } from '@iranianoralhistory/backend-shared-application';
import { PrismaExceptionFilter } from '@iranianoralhistory/backend-shared-database';

async function bootstrap() {
  // Sicherheitskritische Env-Variablen prüfen, bevor irgendetwas hochfährt.
  validateEnv();

  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  // API-Versionierung aktivieren (URI-Segment /v1). Default VERSION_NEUTRAL,
  // damit bestehende Routen unverändert bleiben; künftige Controller können per
  // @Version('1') gezielt versioniert werden, ohne den Rest zu brechen.
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: VERSION_NEUTRAL });
  app.use(helmet());
  // Erlaubte CORS-Origins aus der Umgebung (CORS_ORIGINS, kommasepariert);
  // Fallback auf den lokalen Dev-Origin. Kein hartkodierter Produktions-Origin mehr.
  app.enableCors({ origin: parseCorsOrigins(process.env.CORS_ORIGINS), credentials: true });
  app.use(cookieParser());
  app.useGlobalFilters(new DomainExceptionFilter(), new PrismaExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // unbekannte Felder entfernen
      forbidNonWhitelisted: true, // ... und bei unbekannten Feldern 400 werfen
      transform: true, // Payloads in DTO-Instanzen wandeln (nötig für @ValidateNested/@Type)
    }),
  );
  // Graceful Shutdown: onModuleDestroy/onApplicationShutdown-Hooks (z. B.
  // Prisma $disconnect) laufen bei SIGTERM/SIGINT — sauberer Stop in Containern.
  app.enableShutdownHooks();
  const port = process.env.PORT || 3222;
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/`,
  );
}

bootstrap();
