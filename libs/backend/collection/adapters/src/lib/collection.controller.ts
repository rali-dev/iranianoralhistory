import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  JwtAuthGuard,
  RolesGuard,
  Roles,
} from '@iranianoralhistory/backend-shared-auth-infra';
import { CreateCollectionDto, UpdateCollectionDto } from '@iranianoralhistory/shared-contracts';
import {
  GetAllCollectionsQuery,
  CreateCollectionCommand,
  UpdateCollectionCommand,
  DeleteCollectionCommand,
  AssignVideoCommand,
  RemoveVideoCommand,
} from '@iranianoralhistory/backend-collection-application';

@Controller('collections')
export class CollectionController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  findAll() {
    return this.queryBus.execute(new GetAllCollectionsQuery());
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  create(@Body() dto: CreateCollectionDto) {
    return this.commandBus.execute(new CreateCollectionCommand(dto));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCollectionDto) {
    return this.commandBus.execute(new UpdateCollectionCommand(id, dto));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  @HttpCode(204)
  delete(@Param('id') id: string) {
    return this.commandBus.execute(new DeleteCollectionCommand(id));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post(':id/videos/:videoId')
  assignVideo(@Param('id') collectionId: string, @Param('videoId') videoId: string) {
    return this.commandBus.execute(new AssignVideoCommand(collectionId, videoId));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id/videos/:videoId')
  @HttpCode(204)
  removeVideo(@Param('id') collectionId: string, @Param('videoId') videoId: string) {
    return this.commandBus.execute(new RemoveVideoCommand(collectionId, videoId));
  }
}
