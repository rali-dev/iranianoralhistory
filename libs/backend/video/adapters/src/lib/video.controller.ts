import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  JwtAuthGuard,
  RolesGuard,
  Roles,
} from '@iranianoralhistory/backend-shared-auth-infra';
import {
  CreateVideoDto,
  UpdateVideoDto,
  CreateDocumentDto,
  UpdateDocumentDto,
} from '@iranianoralhistory/shared-contracts';
import {
  GetAllVideosQuery,
  GetVideoByIdQuery,
  CreateVideoCommand,
  UpdateVideoCommand,
  DeleteVideoCommand,
  CreateDocumentCommand,
  UpdateDocumentCommand,
  DeleteDocumentCommand,
} from '@iranianoralhistory/backend-video-application';

@Controller('videos')
export class VideoController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  findAll() {
    return this.queryBus.execute(new GetAllVideosQuery());
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.queryBus.execute(new GetVideoByIdQuery(id));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  create(@Body() dto: CreateVideoDto) {
    return this.commandBus.execute(new CreateVideoCommand(dto));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateVideoDto) {
    return this.commandBus.execute(new UpdateVideoCommand(id, dto));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  @HttpCode(204)
  delete(@Param('id') id: string) {
    return this.commandBus.execute(new DeleteVideoCommand(id));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post(':id/documents')
  addDocument(@Param('id') videoId: string, @Body() dto: CreateDocumentDto) {
    return this.commandBus.execute(new CreateDocumentCommand({ ...dto, videoId }));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/documents/:docId')
  updateDocument(@Param('docId') docId: string, @Body() dto: UpdateDocumentDto) {
    return this.commandBus.execute(new UpdateDocumentCommand(docId, dto));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id/documents/:docId')
  @HttpCode(204)
  deleteDocument(@Param('docId') docId: string) {
    return this.commandBus.execute(new DeleteDocumentCommand(docId));
  }
}
