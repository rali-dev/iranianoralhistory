export interface IEmailService {
  sendPasswordResetCode(to: string, code: string): Promise<void>;
}

export const EMAIL_SERVICE = Symbol('EMAIL_SERVICE');
