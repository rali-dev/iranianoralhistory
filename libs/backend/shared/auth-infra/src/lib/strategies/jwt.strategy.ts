import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { IJwtPayload } from '@iranianoralhistory/shared-contracts';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([JwtStrategy.extractFromCookie]),
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
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
