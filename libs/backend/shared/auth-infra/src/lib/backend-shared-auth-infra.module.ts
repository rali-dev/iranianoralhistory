import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TOKEN_SERVICE } from '@iranianoralhistory/backend-identity-domain';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { TokenUtilsService } from './token-utils.service';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [JwtModule.register({}), PassportModule],
  providers: [
    JwtStrategy,
    JwtRefreshStrategy,
    TokenUtilsService,
    // Port-Binding: Application-Handler injizieren ITokenService via TOKEN_SERVICE.
    { provide: TOKEN_SERVICE, useExisting: TokenUtilsService },
    RolesGuard,
  ],
  exports: [TokenUtilsService, TOKEN_SERVICE, JwtModule, PassportModule, RolesGuard],
})
export class BackendSharedAuthInfraModule {}
