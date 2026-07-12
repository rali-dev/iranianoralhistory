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
import { LoginCommand } from './login.command';

@Injectable()
@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand, AuthTokens> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: IPasswordHasher,
    @Inject(TOKEN_SERVICE) private readonly tokenService: ITokenService,
  ) {}

  async execute(command: LoginCommand): Promise<AuthTokens> {
    const user = await this.userRepo.findByEmail(command.dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordMatch = await user.verifyPassword(command.dto.password, this.passwordHasher);
    if (!passwordMatch) throw new UnauthorizedException('Invalid credentials');

    const payload = { id: user.id, email: user.email.toString(), role: user.role };
    const accessToken = this.tokenService.signAccessToken(payload);
    const refreshToken = this.tokenService.signRefreshToken(payload);

    await this.userRepo.updateRefreshToken(user.id, await this.passwordHasher.hash(refreshToken));

    return { accessToken, refreshToken };
  }
}
