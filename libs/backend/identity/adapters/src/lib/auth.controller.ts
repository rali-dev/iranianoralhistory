import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CommandBus } from '@nestjs/cqrs';
import { Request, Response } from 'express';
import { JwtAuthGuard, JwtRefreshGuard } from '@iranianoralhistory/backend-shared-auth-infra';
import {
  LoginDto,
  RegisterDto,
  ForgotPasswordDto,
  VerifyResetCodeDto,
  ResetPasswordDto,
  IJwtPayload,
  IRefreshJwtPayload,
} from '@iranianoralhistory/shared-contracts';
import {
  RegisterUserCommand,
  LoginCommand,
  LogoutCommand,
  RefreshTokensCommand,
  RequestPasswordResetCommand,
  VerifyResetCodeCommand,
  ResetPasswordCommand,
  AuthTokens,
} from '@iranianoralhistory/backend-identity-application';

@Controller('auth')
export class AuthController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.commandBus.execute(new RegisterUserCommand(dto));
  }

  // Verschärftes Rate-Limit gegen Credential-Stuffing — deutlich strenger als
  // das globale 100/min. (Global bleibt als Obergrenze bestehen.)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Res() res: Response) {
    const tokens = await this.commandBus.execute<LoginCommand, AuthTokens>(new LoginCommand(dto));
    this.setCookies(res, tokens);
    res.json({ message: 'Login successful' });
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res() res: Response) {
    const user = req.user as IJwtPayload;
    await this.commandBus.execute(new LogoutCommand(user.id));
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    res.json({ message: 'Logout successful' });
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res() res: Response) {
    const user = req.user as IRefreshJwtPayload;
    const tokens = await this.commandBus.execute<RefreshTokensCommand, AuthTokens>(
      new RefreshTokensCommand(user.id, user.refreshToken ?? ''),
    );
    this.setCookies(res, tokens);
    res.json({ message: 'Tokens refreshed' });
  }

  // Anti-Enumeration / Anti-Spam für den Reset-Einstieg.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ message: string }> {
    await this.commandBus.execute(new RequestPasswordResetCommand(dto));
    return { message: 'Falls ein Konto mit dieser E-Mail-Adresse existiert, wurde ein Code gesendet.' };
  }

  // Strenges Limit gegen Brute-Force des 6-stelligen Codes.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('verify-reset-code')
  @HttpCode(HttpStatus.OK)
  async verifyResetCode(@Body() dto: VerifyResetCodeDto): Promise<{ message: string }> {
    await this.commandBus.execute(new VerifyResetCodeCommand(dto));
    return { message: 'Code bestätigt.' };
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
    await this.commandBus.execute(new ResetPasswordCommand(dto));
    return { message: 'Passwort erfolgreich zurückgesetzt.' };
  }

  private setCookies(res: Response, tokens: AuthTokens): void {
    const isProd = process.env['NODE_ENV'] === 'production';
    res.cookie('access_token', tokens.accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
}
