import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { IRefreshJwtPayload } from '@iranianoralhistory/shared-contracts';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([JwtRefreshStrategy.extractFromCookie]),
      secretOrKey: config.getOrThrow<string>('JWT_REFRESH_SECRET'),
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
