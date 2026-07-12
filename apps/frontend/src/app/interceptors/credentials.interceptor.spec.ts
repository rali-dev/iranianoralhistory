import { TestBed } from '@angular/core/testing';
import { HttpRequest, HttpHandlerFn, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { credentialsInterceptor } from './credentials.interceptor';

function runInterceptor(url: string): { clonedWith: Record<string, unknown> | null } {
  let clonedWith: Record<string, unknown> | null = null;

  const req = {
    url,
    clone: jest.fn((opts: Record<string, unknown>) => {
      clonedWith = opts;
      return { cloned: true, url };
    }),
  } as unknown as HttpRequest<unknown>;

  const next: HttpHandlerFn = jest.fn().mockReturnValue(of(new HttpResponse({ status: 200 }))) as any;

  TestBed.runInInjectionContext(() => credentialsInterceptor(req, next));

  return { clonedWith };
}

describe('credentialsInterceptor', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('adds withCredentials: true for /api URLs', () => {
    const { clonedWith } = runInterceptor('/api/auth/login');

    expect(clonedWith).toEqual({ withCredentials: true });
  });

  it('adds withCredentials for nested /api paths', () => {
    const { clonedWith } = runInterceptor('/api/videos/v-123');

    expect(clonedWith).toEqual({ withCredentials: true });
  });

  it('does NOT clone the request for non-api URLs', () => {
    const { clonedWith } = runInterceptor('https://external.cdn.com/file.pdf');

    expect(clonedWith).toBeNull();
  });

  it('does NOT add withCredentials for Supabase storage URLs', () => {
    const { clonedWith } = runInterceptor('https://supabase.co/storage/v1/object/sign/bucket/file.pdf');

    expect(clonedWith).toBeNull();
  });

  it('passes through the original request for non-api URLs', () => {
    const req = {
      url: 'https://example.com/image.jpg',
      clone: jest.fn(),
    } as unknown as HttpRequest<unknown>;

    const next: HttpHandlerFn = jest.fn().mockReturnValue(of(new HttpResponse({ status: 200 }))) as any;

    TestBed.runInInjectionContext(() => credentialsInterceptor(req, next));

    expect(req.clone).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(req);
  });
});
