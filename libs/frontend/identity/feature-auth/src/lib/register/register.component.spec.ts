import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RegisterComponent } from './register.component';
import { IdentityApiService } from '@iranianoralhistory/frontend-identity-data-access';
import { I18nService } from '@iranianoralhistory/frontend-shared-i18n';

const mockIdentity: Partial<IdentityApiService> = {
  register: jest.fn(),
};

const mockI18n = {
  t: jest.fn((key: string) => key),
  isRtl: jest.fn().mockReturnValue(false),
  lang: jest.fn().mockReturnValue('de'),
};

function fill(pw = 'password123', confirm = 'password123', email = 'new@example.de') {
  return { email, password: pw, confirmPassword: confirm };
}

async function createComponent() {
  await TestBed.configureTestingModule({
    imports: [RegisterComponent],
    providers: [
      provideRouter([]),
      { provide: IdentityApiService, useValue: mockIdentity },
      { provide: I18nService, useValue: mockI18n },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(RegisterComponent);
  const router = TestBed.inject(Router);
  const navigate = jest.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
  return { fixture, component: fixture.componentInstance, router, navigate };
}

describe('RegisterComponent', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('togglePassword()', () => {
    it('flips the showPassword signal', async () => {
      const { component } = await createComponent();

      component.togglePassword();

      expect(component.showPassword()).toBe(true);
    });
  });

  describe('submit() — validation', () => {
    it('does not call register when the form is empty', async () => {
      const { component } = await createComponent();

      component.submit();

      expect(mockIdentity.register).not.toHaveBeenCalled();
      expect(component.form.touched).toBe(true);
    });

    it('does not call register when the passwords do not match', async () => {
      const { component } = await createComponent();
      component.form.setValue(fill('password123', 'different123'));

      component.submit();

      expect(mockIdentity.register).not.toHaveBeenCalled();
      expect(component.form.hasError('passwordMismatch')).toBe(true);
    });

    it('does not call register when the password is too short', async () => {
      const { component } = await createComponent();
      component.form.setValue(fill('short', 'short'));

      component.submit();

      expect(mockIdentity.register).not.toHaveBeenCalled();
    });
  });

  describe('submit() — success path', () => {
    it('calls register with only email and password', async () => {
      (mockIdentity.register as jest.Mock).mockReturnValue(of({ message: 'ok' }));
      const { component } = await createComponent();
      component.form.setValue(fill());

      component.submit();

      expect(mockIdentity.register).toHaveBeenCalledWith({
        email: 'new@example.de',
        password: 'password123',
      });
    });

    it('navigates to /login after successful registration', async () => {
      (mockIdentity.register as jest.Mock).mockReturnValue(of({ message: 'ok' }));
      const { component, navigate } = await createComponent();
      component.form.setValue(fill());

      component.submit();

      expect(navigate).toHaveBeenCalledWith('/login');
    });
  });

  describe('submit() — error path', () => {
    it('surfaces the server error message and stops loading', async () => {
      (mockIdentity.register as jest.Mock).mockReturnValue(
        throwError(() => ({ error: { message: 'E-Mail bereits vergeben' } })),
      );
      const { component, navigate } = await createComponent();
      component.form.setValue(fill());

      component.submit();

      expect(component.apiError()).toBe('E-Mail bereits vergeben');
      expect(component.isLoading()).toBe(false);
      expect(navigate).not.toHaveBeenCalled();
    });

    it('falls back to the default message when the server sends none', async () => {
      (mockIdentity.register as jest.Mock).mockReturnValue(throwError(() => ({})));
      const { component } = await createComponent();
      component.form.setValue(fill());

      component.submit();

      expect(component.apiError()).toBe(
        'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.',
      );
    });
  });
});
