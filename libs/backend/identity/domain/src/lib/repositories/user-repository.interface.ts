import { UserEntity } from '../entities/user.entity';

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  create(email: string, hashedPassword: string): Promise<UserEntity>;
  updateRefreshToken(id: string, hashedRefreshToken: string | null): Promise<void>;
  updatePassword(id: string, hashedPassword: string): Promise<void>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
