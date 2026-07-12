import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Request } from 'express';
import { JwtAuthGuard } from '@iranianoralhistory/backend-shared-auth-infra';
import { IJwtPayload } from '@iranianoralhistory/shared-contracts';
import { GetMeQuery } from '@iranianoralhistory/backend-identity-application';

@Controller('users')
export class UserCrudController {
  constructor(private readonly queryBus: QueryBus) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req: Request) {
    const user = req.user as IJwtPayload;
    return this.queryBus.execute(new GetMeQuery(user.id));
  }
}
