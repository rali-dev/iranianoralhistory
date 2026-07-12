import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IJwtPayload } from '@iranianoralhistory/shared-contracts';
import { ITokenService } from '@iranianoralhistory/backend-identity-domain';

@Injectable()
export class TokenUtilsService implements ITokenService {
  constructor(private readonly jwtService: JwtService) {}

  signAccessToken(payload: IJwtPayload): string {
    const secret = process.env['JWT_SECRET'];
    if (!secret) throw new Error('JWT_SECRET not set');
    return this.jwtService.sign(payload, { secret, expiresIn: '15m' });
  }

  signRefreshToken(payload: IJwtPayload): string {
    const secret = process.env['JWT_REFRESH_SECRET'];
    if (!secret) throw new Error('JWT_REFRESH_SECRET not set');
    return this.jwtService.sign(payload, { secret, expiresIn: '7d' });
  }
}
