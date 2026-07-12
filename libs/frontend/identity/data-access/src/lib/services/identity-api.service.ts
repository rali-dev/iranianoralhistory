import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import {
  LoginDto,
  RegisterDto,
  ForgotPasswordDto,
  VerifyResetCodeDto,
  ResetPasswordDto,
} from '@iranianoralhistory/shared-contracts';
import { IUser } from '@iranianoralhistory/shared-contracts';
import { authStore } from '../state/auth.store';

@Injectable({ providedIn: 'root' })
export class IdentityApiService {
  private readonly base = '/api/auth';

  private readonly http = inject(HttpClient);

  register(dto: RegisterDto): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/register`, dto);
  }

  login(dto: LoginDto): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/login`, dto);
  }

  logout(): Observable<{ message: string }> {
    return this.http
      .post<{ message: string }>(`${this.base}/logout`, {})
      .pipe(tap(() => authStore.clear()));
  }

  refresh(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/refresh`, {});
  }

  getMe(): Observable<IUser> {
    return this.http.get<IUser>('/api/users/me');
  }

  forgotPassword(dto: ForgotPasswordDto): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/forgot-password`, dto);
  }

  verifyResetCode(dto: VerifyResetCodeDto): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/verify-reset-code`, dto);
  }

  resetPassword(dto: ResetPasswordDto): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/reset-password`, dto);
  }
}
