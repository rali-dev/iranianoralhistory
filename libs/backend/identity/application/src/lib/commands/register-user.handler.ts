import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  IUserRepository,
  USER_REPOSITORY,
  IPasswordHasher,
  PASSWORD_HASHER,
  Email,
  UserRegisteredEvent,
} from '@iranianoralhistory/backend-identity-domain';
import {
  IDomainEventPublisher,
  DOMAIN_EVENT_PUBLISHER,
} from '@iranianoralhistory/shared-contracts';
import { RegisterUserCommand } from './register-user.command';

@Injectable()
@CommandHandler(RegisterUserCommand)
export class RegisterUserHandler implements ICommandHandler<RegisterUserCommand> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: IPasswordHasher,
    @Inject(DOMAIN_EVENT_PUBLISHER) private readonly eventPublisher: IDomainEventPublisher,
  ) {}

  async execute(command: RegisterUserCommand): Promise<{ message: string }> {
    const email = Email.create(command.dto.email);
    const existing = await this.userRepo.findByEmail(email.toString());
    if (existing) throw new BadRequestException('Email already in use');

    const hashedPassword = await this.passwordHasher.hash(command.dto.password);
    const user = await this.userRepo.create(email.toString(), hashedPassword);

    this.eventPublisher.publish(new UserRegisteredEvent(user.id, email.toString()));

    return { message: 'Registration successful' };
  }
}
