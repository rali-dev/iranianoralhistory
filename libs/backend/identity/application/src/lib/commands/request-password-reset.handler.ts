import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { randomInt } from 'crypto';
import {
  IUserRepository,
  USER_REPOSITORY,
  IPasswordResetRepository,
  PASSWORD_RESET_REPOSITORY,
  IEmailService,
  EMAIL_SERVICE,
  IPasswordHasher,
  PASSWORD_HASHER,
} from '@iranianoralhistory/backend-identity-domain';
import { RequestPasswordResetCommand } from './request-password-reset.command';

@Injectable()
@CommandHandler(RequestPasswordResetCommand)
export class RequestPasswordResetHandler
  implements ICommandHandler<RequestPasswordResetCommand, void>
{
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    @Inject(PASSWORD_RESET_REPOSITORY) private readonly resetRepo: IPasswordResetRepository,
    @Inject(EMAIL_SERVICE) private readonly emailService: IEmailService,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(command: RequestPasswordResetCommand): Promise<void> {
    const user = await this.userRepo.findByEmail(command.dto.email);
    // Always succeed — do not reveal whether the email exists
    if (!user) return;

    const code = String(randomInt(100000, 1000000));
    const tokenHash = await this.passwordHasher.hash(code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.resetRepo.upsert(user.id, tokenHash, expiresAt);
    await this.emailService.sendPasswordResetCode(command.dto.email, code);
  }
}
