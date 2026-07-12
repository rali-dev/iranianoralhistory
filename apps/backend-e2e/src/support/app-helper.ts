import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { AppModule } from '../../../backend/src/app/app.module';
import { PrismaService, PrismaExceptionFilter } from '@iranianoralhistory/backend-shared-database';
import { DomainExceptionFilter } from '@iranianoralhistory/backend-shared-application';

export interface TestApp {
  app: INestApplication;
  prisma: PrismaService;
}

/**
 * Bootet die komplette NestJS-Anwendung in-process ohne externen Server.
 * Spiegelt exakt den Bootstrap in main.ts wider.
 */
export async function createTestApp(): Promise<TestApp> {
  const module = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = module.createNestApplication();
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.useGlobalFilters(new DomainExceptionFilter(), new PrismaExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  await app.init();

  const prisma = module.get(PrismaService);
  return { app, prisma };
}
