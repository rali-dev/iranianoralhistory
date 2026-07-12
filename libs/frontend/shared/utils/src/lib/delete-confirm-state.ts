import { Signal, signal } from '@angular/core';

export interface DeleteConfirmState {
  readonly confirmId: Signal<string | null>;
  readonly deletingId: Signal<string | null>;
  ask(id: string): void;
  cancel(): void;
  begin(id: string): void;
  done(): void;
}

export function createDeleteConfirmState(): DeleteConfirmState {
  const _confirmId = signal<string | null>(null);
  const _deletingId = signal<string | null>(null);

  return {
    confirmId: _confirmId.asReadonly(),
    deletingId: _deletingId.asReadonly(),
    ask(id: string): void {
      _confirmId.set(id);
    },
    cancel(): void {
      _confirmId.set(null);
    },
    begin(id: string): void {
      _confirmId.set(null);
      _deletingId.set(id);
    },
    done(): void {
      _deletingId.set(null);
    },
  };
}
