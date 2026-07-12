import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import {
  IdentityApiService,
  authStore,
} from '@iranianoralhistory/frontend-identity-data-access';
import { I18nService } from '@iranianoralhistory/frontend-shared-i18n';
import { IUser } from '@iranianoralhistory/shared-contracts';

const USER: IUser = {
  id: 'user-uuid-1',
  email: 'test@example.de',
  role: 'USER',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const ADMIN: IUser = { ...USER, id: 'admin-uuid', role: 'ADMIN' };

const VALID = { email: 'test@example.de', password: 'password123' };

const mockIdentity: Partial<IdentityApiService> = {
  login: jest.fn(),
  getMe: jest.fn(),
};

const mockI18n = {
  t: jest.fn((key: string) => key),
  isRtl: jest.fn().mockReturnValue(false),
  lang: jest.fn().mockReturnValue('de'),
};

async function createComponent() {
  await TestBed.configureTestingModule({
    imports: [LoginComponent],
    providers: [
      provideRouter([]),
      { provide: IdentityApiService, useValue: mockIdentity },
      { provide: I18nService, useValue: mockI18n },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(LoginComponent);
  const router = TestBed.inject(Router);
  const navigate = jest.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
  return { fixture, component: fixture.componentInstance, router, navigate };
}

describe('LoginComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authStore.clear();
  });

  describe('togglePassword()', () => {
    it('flips the showPassword signal', async () => {
      const { component } = await createComponent();

      expect(component.showPassword()).toBe(false);
      component.togglePassword();
      expect(component.showPassword()).toBe(true);
      component.togglePassword();
      expect(component.showPassword()).toBe(false);
    });
  });

  describe('submit() — validation', () => {
    it('does not call the API when the form is invalid', async () => {
      const { component } = await createComponent();

      component.submit();

      expect(mockIdentity.login).not.toHaveBeenCalled();
      expect(component.form.touched).toBe(true);
    });

    it('is invalid when the email is malformed', async () => {
      const { component } = await createComponent();
      component.form.setValue({ email: 'not-an-email', password: 'password123' });

      component.submit();

      expect(mockIdentity.login).not.toHaveBeenCalled();
    });

    it('is invalid when the password is shorter than 8 characters', async () => {
      const { component } = await createComponent();
      component.form.setValue({ email: 'test@example.de', password: 'short' });

      component.submit();

      expect(mockIdentity.login).not.toHaveBeenCalled();
    });
  });

  describe('submit() — success path', () => {
    it('calls login with the raw form value then loads the current user', async () => {
      (mockIdentity.login as jest.Mock).mockReturnValue(of({ message: 'ok' }));
      (mockIdentity.getMe as jest.Mock).mockReturnValue(of(USER));
      const { component } = await createComponent();
      component.form.setValue(VALID);

      component.submit();

      expect(mockIdentity.login).toHaveBeenCalledWith(VALID);
      expect(mockIdentity.getMe).toHaveBeenCalled();
    });

    it('stores the returned user in the authStore', async () => {
      (mockIdentity.login as jest.Mock).mockReturnValue(of({ message: 'ok' }));
      (mockIdentity.getMe as jest.Mock).mockReturnValue(of(USER));
      const { component } = await createComponent();
      component.form.setValue(VALID);

      component.submit();

      expect(authStore.currentUser()).toEqual(USER);
    });

    it('navigates a normal user to /videos', async () => {
      (mockIdentity.login as jest.Mock).mockReturnValue(of({ message: 'ok' }));
      (mockIdentity.getMe as jest.Mock).mockReturnValue(of(USER));
      const { component, navigate } = await createComponent();
      component.form.setValue(VALID);

      component.submit();

      expect(navigate).toHaveBeenCalledWith('/videos');
    });

    it('navigates an admin user to /admin', async () => {
      (mockIdentity.login as jest.Mock).mockReturnValue(of({ message: 'ok' }));
      (mockIdentity.getMe as jest.Mock).mockReturnValue(of(ADMIN));
      const { component, navigate } = await createComponent();
      component.form.setValue(VALID);

      component.submit();

      expect(navigate).toHaveBeenCalledWith('/admin');
    });

    it('sets isLoading back to false after completion', async () => {
      (mockIdentity.login as jest.Mock).mockReturnValue(of({ message: 'ok' }));
      (mockIdentity.getMe as jest.Mock).mockReturnValue(of(USER));
      const { component } = await createComponent();
      component.form.setValue(VALID);

      component.submit();

      expect(component.isLoading()).toBe(false);
    });
  });

  describe('submit() — error path', () => {
    it('surfaces the server error message', async () => {
      (mockIdentity.login as jest.Mock).mockReturnValue(
        throwError(() => ({ error: { message: 'Falsche Zugangsdaten' } })),
      );
      const { component, navigate } = await createComponent();
      component.form.setValue(VALID);

      component.submit();

      expect(component.apiError()).toBe('Falsche Zugangsdaten');
      expect(navigate).not.toHaveBeenCalled();
    });

    it('falls back to the default message when the server sends none', async () => {
      (mockIdentity.login as jest.Mock).mockReturnValue(throwError(() => ({})));
      const { component } = await createComponent();
      component.form.setValue(VALID);

      component.submit();

      expect(component.apiError()).toBe(
        'Anmeldung fehlgeschlagen. Bitte prüfen Sie Ihre Eingaben.',
      );
    });

    it('resets isLoading to false after a failed login', async () => {
      (mockIdentity.login as jest.Mock).mockReturnValue(
        throwError(() => ({ error: { message: 'nope' } })),
      );
      const { component } = await createComponent();
      component.form.setValue(VALID);

      component.submit();

      expect(component.isLoading()).toBe(false);
    });
  });
});
