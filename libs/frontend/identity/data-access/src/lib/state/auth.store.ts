import { computed, signal } from '@angular/core';
import { IUser } from '@iranianoralhistory/shared-contracts';

type StoreStatus = 'idle' | 'loading' | 'success' | 'error';

const _currentUser = signal<IUser | null>(null);
const _status = signal<StoreStatus>('idle');
const _error = signal<string | null>(null);

export const authStore = {
  currentUser: _currentUser.asReadonly(),
  status: _status.asReadonly(),
  error: _error.asReadonly(),
  isAuthenticated: computed(() => _currentUser() !== null),
  isLoading: computed(() => _status() === 'loading'),

  setLoading(): void {
    _status.set('loading');
    _error.set(null);
  },

  setUser(user: IUser | null): void {
    _currentUser.set(user);
    _status.set('success');
    _error.set(null);
  },

  setError(message: string): void {
    _status.set('error');
    _error.set(message);
  },

  clear(): void {
    _currentUser.set(null);
    _status.set('idle');
    _error.set(null);
  },
};
