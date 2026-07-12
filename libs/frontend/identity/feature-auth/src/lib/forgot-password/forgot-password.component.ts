import { Component, signal, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { IdentityApiService } from '@iranianoralhistory/frontend-identity-data-access';
import { I18nService } from '@iranianoralhistory/frontend-shared-i18n';

type Step = 'email' | 'code' | 'password' | 'success';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const pw = group.get('newPassword')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pw && confirm && pw !== confirm ? { mismatch: true } : null;
}

@Component({
  selector: 'lib-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly identity = inject(IdentityApiService);
  private readonly router = inject(Router);
  readonly i18n = inject(I18nService);

  step = signal<Step>('email');
  isLoading = signal(false);
  apiError = signal<string | null>(null);
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);

  private confirmedEmail = '';
  private confirmedCode = '';

  emailForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  codeForm = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6), Validators.pattern(/^\d{6}$/)]],
  });

  passwordForm = this.fb.nonNullable.group(
    {
      newPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(20)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );

  get email() { return this.emailForm.controls.email; }
  get code() { return this.codeForm.controls.code; }
  get newPassword() { return this.passwordForm.controls.newPassword; }
  get confirmPassword() { return this.passwordForm.controls.confirmPassword; }

  stepIndex(): number {
    return { email: 1, code: 2, password: 3, success: 3 }[this.step()];
  }

  submitEmail(): void {
    if (this.emailForm.invalid) { this.emailForm.markAllAsTouched(); return; }
    this.isLoading.set(true);
    this.apiError.set(null);

    this.identity.forgotPassword({ email: this.email.value }).pipe(
      finalize(() => this.isLoading.set(false)),
    ).subscribe({
      next: () => {
        this.confirmedEmail = this.email.value;
        this.step.set('code');
      },
      error: (err) => this.apiError.set(err?.error?.message ?? 'Ein Fehler ist aufgetreten.'),
    });
  }

  submitCode(): void {
    if (this.codeForm.invalid) { this.codeForm.markAllAsTouched(); return; }
    this.isLoading.set(true);
    this.apiError.set(null);

    this.identity.verifyResetCode({ email: this.confirmedEmail, code: this.code.value }).pipe(
      finalize(() => this.isLoading.set(false)),
    ).subscribe({
      next: () => {
        this.confirmedCode = this.code.value;
        this.step.set('password');
      },
      error: (err) => this.apiError.set(err?.error?.message ?? 'Ungültiger oder abgelaufener Code.'),
    });
  }

  submitPassword(): void {
    if (this.passwordForm.invalid) { this.passwordForm.markAllAsTouched(); return; }
    this.isLoading.set(true);
    this.apiError.set(null);

    this.identity.resetPassword({
      email: this.confirmedEmail,
      code: this.confirmedCode,
      newPassword: this.newPassword.value,
    }).pipe(
      finalize(() => this.isLoading.set(false)),
    ).subscribe({
      next: () => this.step.set('success'),
      error: (err) => this.apiError.set(err?.error?.message ?? 'Ein Fehler ist aufgetreten.'),
    });
  }

  resendCode(): void {
    if (!this.confirmedEmail) return;
    this.apiError.set(null);
    this.identity.forgotPassword({ email: this.confirmedEmail }).subscribe();
  }

  goToLogin(): void {
    this.router.navigateByUrl('/login');
  }
}
