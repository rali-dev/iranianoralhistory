import { authStore } from './auth.store';
import { IUser } from '@iranianoralhistory/shared-contracts';

const TEST_USER: IUser = {
  id: 'user-uuid-1',
  email: 'test@example.de',
  role: 'USER',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('authStore', () => {
  beforeEach(() => {
    authStore.clear();
  });

  describe('initial state', () => {
    it('currentUser is null', () => {
      expect(authStore.currentUser()).toBeNull();
    });

    it('isAuthenticated is false', () => {
      expect(authStore.isAuthenticated()).toBe(false);
    });

    it('isLoading is false', () => {
      expect(authStore.isLoading()).toBe(false);
    });

    it('status is idle', () => {
      expect(authStore.status()).toBe('idle');
    });

    it('error is null', () => {
      expect(authStore.error()).toBeNull();
    });
  });

  describe('setLoading()', () => {
    it('sets status to loading', () => {
      authStore.setLoading();
      expect(authStore.isLoading()).toBe(true);
      expect(authStore.status()).toBe('loading');
    });

    it('clears error when loading starts', () => {
      authStore.setError('previous error');
      authStore.setLoading();
      expect(authStore.error()).toBeNull();
    });
  });

  describe('setUser()', () => {
    it('sets the current user and status to success', () => {
      authStore.setUser(TEST_USER);
      expect(authStore.currentUser()).toEqual(TEST_USER);
      expect(authStore.status()).toBe('success');
    });

    it('sets isAuthenticated to true after login', () => {
      authStore.setUser(TEST_USER);
      expect(authStore.isAuthenticated()).toBe(true);
    });

    it('accepts null to sign the user out', () => {
      authStore.setUser(TEST_USER);
      authStore.setUser(null);
      expect(authStore.currentUser()).toBeNull();
      expect(authStore.isAuthenticated()).toBe(false);
    });
  });

  describe('setError()', () => {
    it('sets status to error and stores the message', () => {
      authStore.setError('unauthorized');
      expect(authStore.status()).toBe('error');
      expect(authStore.error()).toBe('unauthorized');
      expect(authStore.isLoading()).toBe(false);
    });
  });

  describe('clear()', () => {
    it('resets all state to idle after logout', () => {
      authStore.setUser(TEST_USER);
      authStore.clear();
      expect(authStore.currentUser()).toBeNull();
      expect(authStore.isAuthenticated()).toBe(false);
      expect(authStore.status()).toBe('idle');
      expect(authStore.error()).toBeNull();
    });
  });

  describe('computed: isAuthenticated', () => {
    it('is false when no user is set', () => {
      expect(authStore.isAuthenticated()).toBe(false);
    });

    it('is true when a user is set', () => {
      authStore.setUser({ ...TEST_USER, role: 'ADMIN' });
      expect(authStore.isAuthenticated()).toBe(true);
    });
  });
});
