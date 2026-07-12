import { LoginDto } from '@iranianoralhistory/shared-contracts';

export class LoginCommand {
  constructor(public readonly dto: LoginDto) {}
}
