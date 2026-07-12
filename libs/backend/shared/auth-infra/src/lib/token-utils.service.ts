import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { IJwtPayload } from '@iranianoralhistory/shared-contracts';
import { ITokenService } from '@iranianoralhistory/backend-identity-domain';

@Injectable()
export class TokenUtilsService implements ITokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  signAccessToken(payload: IJwtPayload): string {
    const secret = this.config.getOrThrow<string>('JWT_SECRET');
    return this.jwtService.sign(payload, { secret, expiresIn: '15m' });
  }

  signRefreshToken(payload: IJwtPayload): string {
    const secret = this.config.getOrThrow<string>('JWT_REFRESH_SECRET');
    return this.jwtService.sign(payload, { secret, expiresIn: '7d' });
  }
}
