import { Injectable } from '@nestjs/common';
import { PrismaService } from '@iranianoralhistory/backend-shared-database';
import { IPasswordResetTransaction } from '@iranianoralhistory/backend-identity-domain';

/**
 * Prisma-Implementierung des atomaren Passwort-Resets.
 *
 * Beide Writes laufen in EINER Transaktion (`$transaction([...])`): Prisma
 * führt das Array in einer einzigen DB-Transaktion aus — schlägt einer fehl,
 * wird der andere zurückgerollt. Damit ist der Reset all-or-nothing und kann
 * kein noch gültiges Token neben einem bereits geänderten Passwort hinterlassen.
 */
@Injectable()
export class PrismaPasswordResetTransaction implements IPasswordResetTransaction {
  constructor(private readonly prisma: PrismaService) {}

  async commitReset(userId: string, hashedPassword: string): Promise<void> {
    await this.prisma.$transaction([
      // 1) Reset-Token invalidieren.
      this.prisma.passwordResetToken.deleteMany({ where: { userId } }),
      // 2) Neues Passwort setzen.
      this.prisma.user.update({ where: { id: userId }, data: { hashedPassword } }),
    ]);
  }
}
