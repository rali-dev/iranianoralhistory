import { Component, signal, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IdentityApiService } from '@iranianoralhistory/frontend-identity-data-access';
import { I18nService } from '@iranianoralhistory/frontend-shared-i18n';
import { AlertComponent } from '@iranianoralhistory/frontend-shared-ui';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const pw = control.get('password')?.value;
  const confirm = control.get('confirmPassword')?.value;
  return pw && confirm && pw !== confirm ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'lib-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AlertComponent],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly identity = inject(IdentityApiService);
  private readonly router = inject(Router);
  readonly i18n = inject(I18nService);

  isLoading = signal(false);
  apiError = signal<string | null>(null);
  showPassword = signal(false);

  form = this.fb.nonNullable.group(
    {
      email:           ['', [Validators.required, Validators.email]],
      password:        ['', [Validators.required, Validators.minLength(8), Validators.maxLength(20)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatch },
  );

  get email()           { return this.form.controls.email; }
  get password()        { return this.form.controls.password; }
  get confirmPassword() { return this.form.controls.confirmPassword; }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.apiError.set(null);

    const { email, password } = this.form.getRawValue();

    this.identity.register({ email, password }).subscribe({
      next: () => this.router.navigateByUrl('/login'),
      error: (err) => {
        this.isLoading.set(false);
        this.apiError.set(
          err?.error?.message ?? this.i18n.t('AUTH.REGISTER.ERR_GENERIC'),
        );
      },
    });
  }
}
