import { ResetPasswordDto } from '@iranianoralhistory/shared-contracts';

export class ResetPasswordCommand {
  constructor(public readonly dto: ResetPasswordDto) {}
}
