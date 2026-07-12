import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { IRefreshJwtPayload } from '@iranianoralhistory/shared-contracts';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor() {
    const secret = process.env['JWT_REFRESH_SECRET'];
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET environment variable is not set.');
    }
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([JwtRefreshStrategy.extractFromCookie]),
      secretOrKey: secret,
      passReqToCallback: true,
      ignoreExpiration: false,
    });
  }

  private static extractFromCookie(req: Request): string | null {
    return req?.cookies?.['refresh_token'] ?? null;
  }

  async validate(req: Request, payload: IRefreshJwtPayload): Promise<IRefreshJwtPayload> {
    const refreshToken = req?.cookies?.['refresh_token'];
    return { ...payload, refreshToken };
  }
}
