import { IJwtPayload } from '@iranianoralhistory/shared-contracts';

/**
 * Port für das Signieren von JWTs.
 *
 * Die Application-Schicht (Login-/Refresh-Handler) hängt an dieser Abstraktion
 * — injiziert über das TOKEN_SERVICE-Token — statt an der konkreten
 * Infrastruktur-Klasse. So bleibt die Dependency-Regel gewahrt (innen kennt
 * außen nicht) und die Token-Erzeugung ist austauschbar/testbar.
 */
export interface ITokenService {
  signAccessToken(payload: IJwtPayload): string;
  signRefreshToken(payload: IJwtPayload): string;
}

export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');
