import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Request } from 'express';
import { JwtAuthGuard } from '@iranianoralhistory/backend-shared-auth-infra';
import { IJwtPayload } from '@iranianoralhistory/shared-contracts';
import {
  AddFavoriteCommand,
  RemoveFavoriteCommand,
  GetUserFavoritesQuery,
} from '@iranianoralhistory/backend-favorite-application';

@Controller()
export class FavoriteController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('videos/:videoId/favorite')
  @HttpCode(HttpStatus.NO_CONTENT)
  addFavorite(@Req() req: Request, @Param('videoId') videoId: string): Promise<void> {
    const user = req.user as IJwtPayload;
    return this.commandBus.execute(new AddFavoriteCommand(user.id, videoId));
  }

  @UseGuards(JwtAuthGuard)
  @Delete('videos/:videoId/favorite')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeFavorite(@Req() req: Request, @Param('videoId') videoId: string): Promise<void> {
    const user = req.user as IJwtPayload;
    return this.commandBus.execute(new RemoveFavoriteCommand(user.id, videoId));
  }

  @UseGuards(JwtAuthGuard)
  @Get('users/me/favorites')
  getUserFavorites(@Req() req: Request): Promise<string[]> {
    const user = req.user as IJwtPayload;
    return this.queryBus.execute(new GetUserFavoritesQuery(user.id));
  }
}
