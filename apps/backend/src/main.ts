import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app/app.module';
import { validateEnv } from './config/validate-env';
import cookieParser from 'cookie-parser';
import { DomainExceptionFilter } from '@iranianoralhistory/backend-shared-application';
import { PrismaExceptionFilter } from '@iranianoralhistory/backend-shared-database';

async function bootstrap() {
  // Sicherheitskritische Env-Variablen prüfen, bevor irgendetwas hochfährt.
  validateEnv();

  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.use(helmet());
  app.enableCors({ origin: 'http://localhost:4200', credentials: true });
  app.use(cookieParser());
  app.useGlobalFilters(new DomainExceptionFilter(), new PrismaExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // unbekannte Felder entfernen
      forbidNonWhitelisted: true, // ... und bei unbekannten Feldern 400 werfen
      transform: true, // Payloads in DTO-Instanzen wandeln (nötig für @ValidateNested/@Type)
    }),
  );
  const port = process.env.PORT || 3222;
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/`,
  );
}

bootstrap();
