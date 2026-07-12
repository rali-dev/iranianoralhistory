import { DomainException } from '@iranianoralhistory/shared-contracts';

export class VimeoId {
  private readonly value: string;

  private constructor(id: string) {
    this.value = id.trim();
  }

  static create(raw: string): VimeoId {
    if (!VimeoId.isValid(raw)) {
      throw new DomainException(`Invalid Vimeo ID: "${raw}". Must be numeric.`);
    }
    return new VimeoId(raw);
  }

  static isValid(raw: string): boolean {
    return /^\d+$/.test(raw.trim());
  }

  toString(): string {
    return this.value;
  }

  toJSON(): string {
    return this.value;
  }
}
