import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IUserRepository, USER_REPOSITORY } from '@iranianoralhistory/backend-identity-domain';
import { LogoutCommand } from './logout.command';

@Injectable()
@CommandHandler(LogoutCommand)
export class LogoutHandler implements ICommandHandler<LogoutCommand, void> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
  ) {}

  async execute(command: LogoutCommand): Promise<void> {
    await this.userRepo.updateRefreshToken(command.userId, null);
  }
}
