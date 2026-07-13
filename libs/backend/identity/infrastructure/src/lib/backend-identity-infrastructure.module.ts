import { Global, Module } from '@nestjs/common';
import {
  USER_REPOSITORY,
  PASSWORD_RESET_REPOSITORY,
  PASSWORD_RESET_TX,
  EMAIL_SERVICE,
  PASSWORD_HASHER,
} from '@iranianoralhistory/backend-identity-domain';
import { PrismaUserRepository } from './prisma-user.repository';
import { PrismaPasswordResetRepository } from './prisma-password-reset.repository';
import { PrismaPasswordResetTransaction } from './prisma-password-reset-transaction';
import { ResendEmailService } from './resend-email.service';
import { BcryptPasswordHasher } from './bcrypt-password-hasher';

@Global()
@Module({
  providers: [
    PrismaUserRepository,
    { provide: USER_REPOSITORY, useExisting: PrismaUserRepository },
    PrismaPasswordResetRepository,
    { provide: PASSWORD_RESET_REPOSITORY, useExisting: PrismaPasswordResetRepository },
    PrismaPasswordResetTransaction,
    { provide: PASSWORD_RESET_TX, useExisting: PrismaPasswordResetTransaction },
    ResendEmailService,
    { provide: EMAIL_SERVICE, useExisting: ResendEmailService },
    BcryptPasswordHasher,
    { provide: PASSWORD_HASHER, useExisting: BcryptPasswordHasher },
  ],
  exports: [
    USER_REPOSITORY,
    PASSWORD_RESET_REPOSITORY,
    PASSWORD_RESET_TX,
    EMAIL_SERVICE,
    PASSWORD_HASHER,
  ],
})
export class BackendIdentityInfrastructureModule {}
