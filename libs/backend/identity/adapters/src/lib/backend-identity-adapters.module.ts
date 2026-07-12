import { Module } from '@nestjs/common';
import { BackendSharedAuthInfraModule } from '@iranianoralhistory/backend-shared-auth-infra';
import { BackendIdentityApplicationModule } from '@iranianoralhistory/backend-identity-application';
import { AuthController } from './auth.controller';
import { UserCrudController } from './user-crud.controller';

@Module({
  imports: [BackendSharedAuthInfraModule, BackendIdentityApplicationModule],
  controllers: [AuthController, UserCrudController],
})
export class BackendIdentityAdaptersModule {}
