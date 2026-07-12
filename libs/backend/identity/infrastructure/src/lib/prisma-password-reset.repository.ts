import { Injectable } from '@nestjs/common';
import { PrismaService } from '@iranianoralhistory/backend-shared-database';
import {
  IPasswordResetRepository,
  PasswordResetRecord,
} from '@iranianoralhistory/backend-identity-domain';

@Injectable()
export class PrismaPasswordResetRepository implements IPasswordResetRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await this.prisma.passwordResetToken.upsert({
      where: { userId },
      create: { userId, tokenHash, expiresAt },
      update: { tokenHash, expiresAt },
    });
  }

  async findByUserId(userId: string): Promise<PasswordResetRecord | null> {
    const row = await this.prisma.passwordResetToken.findUnique({ where: { userId } });
    if (!row) return null;
    return { tokenHash: row.tokenHash, expiresAt: row.expiresAt };
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.prisma.passwordResetToken.deleteMany({ where: { userId } });
  }
}
