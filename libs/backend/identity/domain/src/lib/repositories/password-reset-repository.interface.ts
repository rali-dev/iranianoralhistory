export interface PasswordResetRecord {
  tokenHash: string;
  expiresAt: Date;
}

export interface IPasswordResetRepository {
  upsert(userId: string, tokenHash: string, expiresAt: Date): Promise<void>;
  findByUserId(userId: string): Promise<PasswordResetRecord | null>;
  deleteByUserId(userId: string): Promise<void>;
}

export const PASSWORD_RESET_REPOSITORY = Symbol('PASSWORD_RESET_REPOSITORY');
