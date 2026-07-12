import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { BackendSharedAuthInfraModule } from '@iranianoralhistory/backend-shared-auth-infra';
import { RegisterUserHandler } from './commands/register-user.handler';
import { LoginHandler } from './commands/login.handler';
import { LogoutHandler } from './commands/logout.handler';
import { RefreshTokensHandler } from './commands/refresh-tokens.handler';
import { RequestPasswordResetHandler } from './commands/request-password-reset.handler';
import { VerifyResetCodeHandler } from './commands/verify-reset-code.handler';
import { ResetPasswordHandler } from './commands/reset-password.handler';
import { GetMeHandler } from './queries/get-me.handler';
import { UserRegisteredListener } from './events/user-registered.listener';

const COMMAND_HANDLERS = [
  RegisterUserHandler,
  LoginHandler,
  LogoutHandler,
  RefreshTokensHandler,
  RequestPasswordResetHandler,
  VerifyResetCodeHandler,
  ResetPasswordHandler,
];
const QUERY_HANDLERS = [GetMeHandler];
const EVENT_LISTENERS = [UserRegisteredListener];

@Module({
  imports: [CqrsModule, BackendSharedAuthInfraModule],
  providers: [...COMMAND_HANDLERS, ...QUERY_HANDLERS, ...EVENT_LISTENERS],
  exports: [CqrsModule],
})
export class BackendIdentityApplicationModule {}
