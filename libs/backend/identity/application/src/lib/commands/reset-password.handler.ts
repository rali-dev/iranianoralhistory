import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  IUserRepository,
  USER_REPOSITORY,
  IPasswordResetRepository,
  PASSWORD_RESET_REPOSITORY,
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

    // Reset-Token ZUERST invalidieren, dann das neue Passwort setzen. So kann
    // ein Fehler zwischen den beiden Writes nie ein noch gültiges Token neben
    // einem bereits geänderten Passwort hinterlassen (kein Reuse-Risiko).
    // Hinweis: echte DB-Atomarität beider Writes wäre ein Unit-of-Work-Schritt.
    await this.resetRepo.deleteByUserId(user.id);
    await this.userRepo.updatePassword(user.id, hashedPassword);
  }
}
