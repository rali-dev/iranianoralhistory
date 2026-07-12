import { RegisterDto } from '@iranianoralhistory/shared-contracts';

export class RegisterUserCommand {
  constructor(public readonly dto: RegisterDto) {}
}
