import { VerifyResetCodeDto } from '@iranianoralhistory/shared-contracts';

export class VerifyResetCodeCommand {
  constructor(public readonly dto: VerifyResetCodeDto) {}
}
