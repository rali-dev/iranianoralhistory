import { Injectable } from '@nestjs/common';
import { PrismaService } from '@iranianoralhistory/backend-shared-database';
import { IUserRepository, UserEntity } from '@iranianoralhistory/backend-identity-domain';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<UserEntity | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? UserEntity.fromPersistence(row) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const row = await this.prisma.user.findUnique({ where: { email } });
    return row ? UserEntity.fromPersistence(row) : null;
  }

  async create(email: string, hashedPassword: string): Promise<UserEntity> {
    const row = await this.prisma.user.create({ data: { email, hashedPassword } });
    return UserEntity.fromPersistence(row);
  }

  async updateRefreshToken(id: string, hashedRefreshToken: string | null): Promise<void> {
    await this.prisma.user.update({ where: { id }, data: { hashedRefreshToken } });
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await this.prisma.user.update({ where: { id }, data: { hashedPassword } });
  }
}
