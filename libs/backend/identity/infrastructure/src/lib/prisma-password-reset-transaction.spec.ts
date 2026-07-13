import { PrismaPasswordResetTransaction } from './prisma-password-reset-transaction';

describe('PrismaPasswordResetTransaction', () => {
  let deleteResult: object;
  let updateResult: object;
  let prisma: {
    passwordResetToken: { deleteMany: jest.Mock };
    user: { update: jest.Mock };
    $transaction: jest.Mock;
  };
  let tx: PrismaPasswordResetTransaction;

  beforeEach(() => {
    // Prisma-Operationen geben PrismaPromise-Objekte zurück; hier reichen
    // eindeutige Sentinels, um zu beweisen, dass GENAU diese beiden Operationen
    // gemeinsam an $transaction gereicht werden.
    deleteResult = { op: 'delete' };
    updateResult = { op: 'update' };
    prisma = {
      passwordResetToken: { deleteMany: jest.fn().mockReturnValue(deleteResult) },
      user: { update: jest.fn().mockReturnValue(updateResult) },
      $transaction: jest.fn().mockResolvedValue([undefined, undefined]),
    };
    tx = new PrismaPasswordResetTransaction(prisma as any);
  });

  it('runs the token delete and password update in a single $transaction', async () => {
    await tx.commitReset('user-1', 'hashed-pw');

    expect(prisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { hashedPassword: 'hashed-pw' },
    });
    // Beide Operationen werden GEMEINSAM in einer Transaktion ausgeführt.
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.$transaction).toHaveBeenCalledWith([deleteResult, updateResult]);
  });

  it('deletes the token BEFORE updating the password within the transaction batch', async () => {
    await tx.commitReset('user-1', 'hashed-pw');

    const batch = prisma.$transaction.mock.calls[0][0] as object[];
    expect(batch[0]).toBe(deleteResult);
    expect(batch[1]).toBe(updateResult);
  });

  it('propagates a transaction failure (all-or-nothing)', async () => {
    const boom = new Error('tx failed');
    prisma.$transaction.mockRejectedValue(boom);

    await expect(tx.commitReset('user-1', 'hashed-pw')).rejects.toBe(boom);
  });
});
