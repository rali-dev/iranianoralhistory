import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ForgotPasswordComponent } from './forgot-password.component';
import { IdentityApiService } from '@iranianoralhistory/frontend-identity-data-access';
import { I18nService } from '@iranianoralhistory/frontend-shared-i18n';

const EMAIL = 'reset@example.de';
const CODE = '123456';
const NEW_PW = 'brandNewPw1';

const mockIdentity: Partial<IdentityApiService> = {
  forgotPassword: jest.fn(),
  verifyResetCode: jest.fn(),
  resetPassword: jest.fn(),
};

const mockI18n = {
  t: jest.fn((key: string) => key),
  isRtl: jest.fn().mockReturnValue(false),
  lang: jest.fn().mockReturnValue('de'),
};

async function createComponent() {
  await TestBed.configureTestingModule({
    imports: [ForgotPasswordComponent],
    providers: [
      provideRouter([]),
      { provide: IdentityApiService, useValue: mockIdentity },
      { provide: I18nService, useValue: mockI18n },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(ForgotPasswordComponent);
  const router = TestBed.inject(Router);
  const navigate = jest.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
  return { fixture, component: fixture.componentInstance, router, navigate };
}

/** Drives the component from the initial email step to the requested step. */
async function advanceToStep(target: 'code' | 'password') {
  (mockIdentity.forgotPassword as jest.Mock).mockReturnValue(of({ message: 'ok' }));
  (mockIdentity.verifyResetCode as jest.Mock).mockReturnValue(of({ message: 'ok' }));
  const ctx = await createComponent();
  ctx.component.emailForm.setValue({ email: EMAIL });
  ctx.component.submitEmail();
  if (target === 'password') {
    ctx.component.codeForm.setValue({ code: CODE });
    ctx.component.submitCode();
  }
  return ctx;
}

describe('ForgotPasswordComponent', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('stepIndex()', () => {
    it('maps each step to its progress index', async () => {
      const { component } = await createComponent();

      expect(component.stepIndex()).toBe(1);
      component.step.set('code');
      expect(component.stepIndex()).toBe(2);
      component.step.set('password');
      expect(component.stepIndex()).toBe(3);
      component.step.set('success');
      expect(component.stepIndex()).toBe(3);
    });
  });

  describe('submitEmail()', () => {
    it('does nothing when the email is invalid', async () => {
      const { component } = await createComponent();
      component.emailForm.setValue({ email: 'not-valid' });

      component.submitEmail();

      expect(mockIdentity.forgotPassword).not.toHaveBeenCalled();
      expect(component.step()).toBe('email');
    });

    it('requests a reset code and advances to the code step', async () => {
      (mockIdentity.forgotPassword as jest.Mock).mockReturnValue(of({ message: 'ok' }));
      const { component } = await createComponent();
      component.emailForm.setValue({ email: EMAIL });

      component.submitEmail();

      expect(mockIdentity.forgotPassword).toHaveBeenCalledWith({ email: EMAIL });
      expect(component.step()).toBe('code');
      expect(component.isLoading()).toBe(false);
    });

    it('shows the error and stays on the email step on failure', async () => {
      (mockIdentity.forgotPassword as jest.Mock).mockReturnValue(
        throwError(() => ({ error: { message: 'Unbekannte E-Mail' } })),
      );
      const { component } = await createComponent();
      component.emailForm.setValue({ email: EMAIL });

      component.submitEmail();

      expect(component.apiError()).toBe('Unbekannte E-Mail');
      expect(component.step()).toBe('email');
      expect(component.isLoading()).toBe(false);
    });
  });

  describe('submitCode()', () => {
    it('does nothing when the code is not six digits', async () => {
      const { component } = await advanceToStep('code');
      jest.clearAllMocks();
      component.codeForm.setValue({ code: '12' });

      component.submitCode();

      expect(mockIdentity.verifyResetCode).not.toHaveBeenCalled();
    });

    it('verifies the code against the confirmed email and advances', async () => {
      (mockIdentity.verifyResetCode as jest.Mock).mockReturnValue(of({ message: 'ok' }));
      const { component } = await advanceToStep('code');
      component.codeForm.setValue({ code: CODE });

      component.submitCode();

      expect(mockIdentity.verifyResetCode).toHaveBeenCalledWith({
        email: EMAIL,
        code: CODE,
      });
      expect(component.step()).toBe('password');
    });

    it('shows the error and stays on the code step on failure', async () => {
      const { component } = await advanceToStep('code');
      (mockIdentity.verifyResetCode as jest.Mock).mockReturnValue(
        throwError(() => ({ error: { message: 'Ungültiger Code' } })),
      );
      component.codeForm.setValue({ code: CODE });

      component.submitCode();

      expect(component.apiError()).toBe('Ungültiger Code');
      expect(component.step()).toBe('code');
    });
  });

  describe('submitPassword()', () => {
    it('does nothing when the passwords do not match', async () => {
      const { component } = await advanceToStep('password');
      component.passwordForm.setValue({ newPassword: NEW_PW, confirmPassword: 'other12345' });

      component.submitPassword();

      expect(mockIdentity.resetPassword).not.toHaveBeenCalled();
      expect(component.passwordForm.hasError('mismatch')).toBe(true);
    });

    it('resets the password with the confirmed email and code, then shows success', async () => {
      (mockIdentity.resetPassword as jest.Mock).mockReturnValue(of({ message: 'ok' }));
      const { component } = await advanceToStep('password');
      component.passwordForm.setValue({ newPassword: NEW_PW, confirmPassword: NEW_PW });

      component.submitPassword();

      expect(mockIdentity.resetPassword).toHaveBeenCalledWith({
        email: EMAIL,
        code: CODE,
        newPassword: NEW_PW,
      });
      expect(component.step()).toBe('success');
      expect(component.isLoading()).toBe(false);
    });

    it('shows the error and stays on the password step on failure', async () => {
      const { component } = await advanceToStep('password');
      (mockIdentity.resetPassword as jest.Mock).mockReturnValue(
        throwError(() => ({ error: { message: 'Code abgelaufen' } })),
      );
      component.passwordForm.setValue({ newPassword: NEW_PW, confirmPassword: NEW_PW });

      component.submitPassword();

      expect(component.apiError()).toBe('Code abgelaufen');
      expect(component.step()).toBe('password');
    });
  });

  describe('resendCode()', () => {
    it('re-requests the code for the confirmed email', async () => {
      const { component } = await advanceToStep('code');
      jest.clearAllMocks();
      (mockIdentity.forgotPassword as jest.Mock).mockReturnValue(of({ message: 'ok' }));

      component.resendCode();

      expect(mockIdentity.forgotPassword).toHaveBeenCalledWith({ email: EMAIL });
    });

    it('does nothing when no email has been confirmed yet', async () => {
      const { component } = await createComponent();

      component.resendCode();

      expect(mockIdentity.forgotPassword).not.toHaveBeenCalled();
    });
  });

  describe('goToLogin()', () => {
    it('navigates to /login', async () => {
      const { component, navigate } = await createComponent();

      component.goToLogin();

      expect(navigate).toHaveBeenCalledWith('/login');
    });
  });
});
