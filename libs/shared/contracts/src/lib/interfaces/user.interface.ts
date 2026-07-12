export type UserRole = 'USER' | 'ADMIN';

export interface IUser {
  id: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface IJwtPayload {
  id: string;
  email: string;
  role: UserRole;
}

export interface IRefreshJwtPayload extends IJwtPayload {
  refreshToken?: string;
}
