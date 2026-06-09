import { Injectable } from '@nestjs/common';
import { PrismaService } from '@iranianoralhistory/database';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getAllUsers() {
    return await this.prisma.user.findMany({
      select: { id: true, email: true },
    });
  }

  async getUserById(id: string) {
    return await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true },
    });
  }
}
