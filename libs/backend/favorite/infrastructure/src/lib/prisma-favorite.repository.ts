import { Injectable } from '@nestjs/common';
import { PrismaService } from '@iranianoralhistory/backend-shared-database';
import {
  IFavoriteRepository,
} from '@iranianoralhistory/backend-favorite-domain';

@Injectable()
export class PrismaFavoriteRepository implements IFavoriteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async add(userId: string, videoId: string): Promise<void> {
    await this.prisma.userFavorite.upsert({
      where: { userId_videoId: { userId, videoId } },
      create: { userId, videoId },
      update: {},
    });
  }

  async remove(userId: string, videoId: string): Promise<void> {
    await this.prisma.userFavorite.deleteMany({
      where: { userId, videoId },
    });
  }

  async findVideoIdsByUser(userId: string): Promise<string[]> {
    const rows = await this.prisma.userFavorite.findMany({
      where: { userId },
      select: { videoId: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => r.videoId);
  }
}
