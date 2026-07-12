import { UserRole } from '@iranianoralhistory/shared-contracts';
import { Email } from '../value-objects/email.value-object';
import { IPasswordHasher } from '../services/password-hasher.interface';

export class UserEntity {
  constructor(
    public readonly id: string,
    public readonly email: Email,
    private readonly hashedPassword: string,
    private readonly hashedRefreshToken: string | null,
    public readonly role: UserRole = 'USER',
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}

  static fromPersistence(row: {
    id: string;
    email: string;
    hashedPassword: string;
    hashedRefreshToken?: string | null;
    role?: string;
    createdAt?: Date;
    updatedAt?: Date;
  }): UserEntity {
    return new UserEntity(
      row.id,
      Email.create(row.email),
      row.hashedPassword,
      row.hashedRefreshToken ?? null,
      (row.role as UserRole) ?? 'USER',
      row.createdAt,
      row.updatedAt,
    );
  }

  async verifyPassword(plain: string, hasher: IPasswordHasher): Promise<boolean> {
    return hasher.compare(plain, this.hashedPassword);
  }

  async verifyRefreshToken(token: string, hasher: IPasswordHasher): Promise<boolean> {
    if (!this.hashedRefreshToken) return false;
    return hasher.compare(token, this.hashedRefreshToken);
  }

  hasRefreshToken(): boolean {
    return this.hashedRefreshToken !== null;
  }

  withoutSensitiveData(): { id: string; email: string; role: UserRole; createdAt?: Date; updatedAt?: Date } {
    return {
      id: this.id,
      email: this.email.toString(),
      role: this.role,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
