import { DomainException } from '@iranianoralhistory/shared-contracts';

export class Email {
  private readonly value: string;

  private constructor(email: string) {
    this.value = email.toLowerCase().trim();
  }

  static create(raw: string): Email {
    if (!Email.isValid(raw)) {
      throw new DomainException(`Invalid email address: "${raw}"`);
    }
    return new Email(raw);
  }

  static isValid(raw: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.trim());
  }

  toString(): string {
    return this.value;
  }

  toJSON(): string {
    return this.value;
  }
}
