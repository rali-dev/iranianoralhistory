import { Signal, signal } from '@angular/core';

export interface FormState {
  readonly isLoading: Signal<boolean>;
  readonly error: Signal<string | null>;
  readonly success: Signal<string | null>;
  start(): void;
  setError(message: string): void;
  setSuccess(message: string): void;
  reset(): void;
}

export function createFormState(): FormState {
  const _isLoading = signal(false);
  const _error = signal<string | null>(null);
  const _success = signal<string | null>(null);

  return {
    isLoading: _isLoading.asReadonly(),
    error: _error.asReadonly(),
    success: _success.asReadonly(),
    start(): void {
      _isLoading.set(true);
      _error.set(null);
      _success.set(null);
    },
    setError(message: string): void {
      _isLoading.set(false);
      _error.set(message);
    },
    setSuccess(message: string): void {
      _isLoading.set(false);
      _success.set(message);
    },
    reset(): void {
      _isLoading.set(false);
      _error.set(null);
      _success.set(null);
    },
  };
}
