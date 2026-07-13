import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  IUserRepository,
  USER_REPOSITORY,
  IPasswordResetRepository,
  PASSWORD_RESET_REPOSITORY,
  IPasswordResetTransaction,
  PASSWORD_RESET_TX,
  IPasswordHasher,
  PASSWORD_HASHER,
} from '@iranianoralhistory/backend-identity-domain';
import { ResetPasswordCommand } from './reset-password.command';

@Injectable()
@CommandHandler(ResetPasswordCommand)
export class ResetPasswordHandler
  implements ICommandHandler<ResetPasswordCommand, void>
{
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    @Inject(PASSWORD_RESET_REPOSITORY) private readonly resetRepo: IPasswordResetRepository,
    @Inject(PASSWORD_RESET_TX) private readonly resetTx: IPasswordResetTransaction,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(command: ResetPasswordCommand): Promise<void> {
    const invalid = () => new BadRequestException('Ungültiger oder abgelaufener Code.');

    const user = await this.userRepo.findByEmail(command.dto.email);
    if (!user) throw invalid();

    const record = await this.resetRepo.findByUserId(user.id);
    if (!record || record.expiresAt < new Date()) throw invalid();

    const match = await this.passwordHasher.compare(command.dto.code, record.tokenHash);
    if (!match) throw invalid();

    const hashedPassword = await this.passwordHasher.hash(command.dto.newPassword);

    // Beide Writes — Token invalidieren UND Passwort setzen — laufen atomar in
    // EINER DB-Transaktion (Unit-of-Work). Schlägt einer fehl, wird der andere
    // zurückgerollt: nie ein noch gültiges Token neben einem bereits geänderten
    // Passwort (kein Reuse-Risiko), nie ein invalidiertes Token bei
    // unverändertem Passwort.
    await this.resetTx.commitReset(user.id, hashedPassword);
  }
}
