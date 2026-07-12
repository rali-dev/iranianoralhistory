import { TestBed } from '@angular/core/testing';
import { HttpInterceptorFn, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { IdentityApiService } from './identity-api.service';
import { authStore } from '../state/auth.store';

const credentialsInterceptor: HttpInterceptorFn = (req, next) =>
  next(req.url.startsWith('/api') ? req.clone({ withCredentials: true }) : req);

describe('IdentityApiService', () => {
  let service: IdentityApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        IdentityApiService,
        provideHttpClient(withInterceptors([credentialsInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(IdentityApiService);
    http = TestBed.inject(HttpTestingController);
    authStore.clear();
  });

  afterEach(() => {
    http.verify();
  });

  describe('register()', () => {
    it('sends POST to /api/auth/register', () => {
      service.register({ email: 'new@test.de', password: 'Test123' }).subscribe();

      const req = http.expectOne('/api/auth/register');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'new@test.de', password: 'Test123' });
      req.flush({ message: 'Registration successful' });
    });

    it('returns the success message', (done) => {
      service.register({ email: 'a@b.de', password: 'pw' }).subscribe((res) => {
        expect(res.message).toBe('Registration successful');
        done();
      });

      http.expectOne('/api/auth/register').flush({ message: 'Registration successful' });
    });
  });

  describe('login()', () => {
    it('sends POST to /api/auth/login with withCredentials', () => {
      service.login({ email: 'user@test.de', password: 'pw' }).subscribe();

      const req = http.expectOne('/api/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.withCredentials).toBe(true);
      req.flush({ message: 'Login successful' });
    });
  });

  describe('logout()', () => {
    it('clears the store after a successful logout', (done) => {
      authStore.setUser({ id: '1', email: 'a@b.de', role: 'USER', createdAt: new Date(), updatedAt: new Date() });

      service.logout().subscribe(() => {
        expect(authStore.currentUser()).toBeNull();
        done();
      });

      http.expectOne('/api/auth/logout').flush({ message: 'Logout successful' });
    });
  });

  describe('getMe()', () => {
    it('sends GET to /api/users/me with withCredentials', () => {
      service.getMe().subscribe();

      const req = http.expectOne('/api/users/me');
      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBe(true);
      req.flush({ id: '1', email: 'me@test.de', role: 'USER' });
    });
  });

  describe('forgotPassword()', () => {
    it('sends POST to /api/auth/forgot-password', () => {
      service.forgotPassword({ email: 'user@test.de' }).subscribe();

      const req = http.expectOne('/api/auth/forgot-password');
      expect(req.request.method).toBe('POST');
      req.flush({ message: 'Email sent' });
    });
  });

  describe('verifyResetCode()', () => {
    it('sends POST to /api/auth/verify-reset-code', () => {
      service.verifyResetCode({ email: 'a@b.de', code: '123456' }).subscribe();

      const req = http.expectOne('/api/auth/verify-reset-code');
      expect(req.request.method).toBe('POST');
      req.flush({ message: 'Code verified.' });
    });
  });

  describe('resetPassword()', () => {
    it('sends POST to /api/auth/reset-password', () => {
      service.resetPassword({ email: 'a@b.de', code: '123456', newPassword: 'NewPW99' }).subscribe();

      const req = http.expectOne('/api/auth/reset-password');
      expect(req.request.method).toBe('POST');
      req.flush({ message: 'Password reset.' });
    });
  });

  describe('refresh()', () => {
    it('sends POST to /api/auth/refresh with withCredentials', () => {
      service.refresh().subscribe();

      const req = http.expectOne('/api/auth/refresh');
      expect(req.request.method).toBe('POST');
      expect(req.request.withCredentials).toBe(true);
      req.flush({ message: 'Tokens refreshed' });
    });
  });
});
