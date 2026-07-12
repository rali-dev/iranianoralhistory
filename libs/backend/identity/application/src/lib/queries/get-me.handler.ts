import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { IUserRepository, USER_REPOSITORY } from '@iranianoralhistory/backend-identity-domain';
import { GetMeQuery } from './get-me.query';

export interface GetMeResult {
  id: string;
  email: string;
  role: string;
  createdAt?: Date;
}

@Injectable()
@QueryHandler(GetMeQuery)
export class GetMeHandler implements IQueryHandler<GetMeQuery, GetMeResult> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
  ) {}

  async execute(query: GetMeQuery): Promise<GetMeResult> {
    const user = await this.userRepo.findById(query.userId);
    if (!user) throw new UnauthorizedException('User not found');
    return { id: user.id, email: user.email.toString(), role: user.role, createdAt: user.createdAt };
  }
}
