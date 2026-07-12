import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { IJwtPayload } from '@iranianoralhistory/shared-contracts';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    const secret = process.env['JWT_SECRET'];
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not set.');
    }
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([JwtStrategy.extractFromCookie]),
      secretOrKey: secret,
      ignoreExpiration: false,
    });
  }

  private static extractFromCookie(req: Request): string | null {
    return req?.cookies?.['access_token'] ?? null;
  }

  async validate(payload: IJwtPayload): Promise<IJwtPayload> {
    return payload;
  }
}
