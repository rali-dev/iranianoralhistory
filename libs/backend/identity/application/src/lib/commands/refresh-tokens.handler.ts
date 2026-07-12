import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  IUserRepository,
  USER_REPOSITORY,
  IPasswordHasher,
  PASSWORD_HASHER,
  ITokenService,
  TOKEN_SERVICE,
} from '@iranianoralhistory/backend-identity-domain';
import { AuthTokens } from '../auth-tokens';
import { RefreshTokensCommand } from './refresh-tokens.command';

@Injectable()
@CommandHandler(RefreshTokensCommand)
export class RefreshTokensHandler implements ICommandHandler<RefreshTokensCommand, AuthTokens> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: IPasswordHasher,
    @Inject(TOKEN_SERVICE) private readonly tokenService: ITokenService,
  ) {}

  async execute(command: RefreshTokensCommand): Promise<AuthTokens> {
    const user = await this.userRepo.findById(command.userId);
    if (!user || !user.hasRefreshToken()) throw new UnauthorizedException('Access denied');

    const tokenMatch = await user.verifyRefreshToken(command.incomingToken, this.passwordHasher);
    if (!tokenMatch) throw new UnauthorizedException('Access denied');

    const payload = { id: user.id, email: user.email.toString(), role: user.role };
    const accessToken = this.tokenService.signAccessToken(payload);
    const refreshToken = this.tokenService.signRefreshToken(payload);

    await this.userRepo.updateRefreshToken(user.id, await this.passwordHasher.hash(refreshToken));

    return { accessToken, refreshToken };
  }
}
