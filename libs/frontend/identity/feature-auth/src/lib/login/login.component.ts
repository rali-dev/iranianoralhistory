import { Component, signal, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize, switchMap } from 'rxjs';
import {
  IdentityApiService,
  authStore,
} from '@iranianoralhistory/frontend-identity-data-access';
import { I18nService } from '@iranianoralhistory/frontend-shared-i18n';

@Component({
  selector: 'lib-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly identity = inject(IdentityApiService);
  private readonly router = inject(Router);
  readonly i18n = inject(I18nService);

  isLoading = signal(false);
  apiError = signal<string | null>(null);
  showPassword = signal(false);

  form = this.fb.nonNullable.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  get email()    { return this.form.controls.email; }
  get password() { return this.form.controls.password; }

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

    this.identity.login(this.form.getRawValue()).pipe(
      switchMap(() => this.identity.getMe()),
      finalize(() => this.isLoading.set(false)),
    ).subscribe({
      next: (user) => {
        authStore.setUser(user);
        this.router.navigateByUrl(user.role === 'ADMIN' ? '/admin' : '/videos');
      },
      error: (err) => {
        this.apiError.set(
          err?.error?.message ?? 'Anmeldung fehlgeschlagen. Bitte prüfen Sie Ihre Eingaben.',
        );
      },
    });
  }
}
