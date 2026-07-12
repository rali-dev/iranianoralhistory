import { ForgotPasswordDto } from '@iranianoralhistory/shared-contracts';

export class RequestPasswordResetCommand {
  constructor(public readonly dto: ForgotPasswordDto) {}
}
