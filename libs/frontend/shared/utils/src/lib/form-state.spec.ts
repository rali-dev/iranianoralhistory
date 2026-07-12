import { TestBed } from '@angular/core/testing';
import { createFormState } from './form-state';

describe('createFormState()', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('starts with isLoading=false, error=null, success=null', () => {
    const state = TestBed.runInInjectionContext(() => createFormState());
    expect(state.isLoading()).toBe(false);
    expect(state.error()).toBeNull();
    expect(state.success()).toBeNull();
  });

  it('start() sets isLoading=true and clears error and success', () => {
    const state = TestBed.runInInjectionContext(() => createFormState());
    state.setError('previous error');
    state.setSuccess('previous success');

    state.start();

    expect(state.isLoading()).toBe(true);
    expect(state.error()).toBeNull();
    expect(state.success()).toBeNull();
  });

  it('setError() sets the error message and clears isLoading', () => {
    const state = TestBed.runInInjectionContext(() => createFormState());
    state.start();
    state.setError('E-Mail already taken');

    expect(state.isLoading()).toBe(false);
    expect(state.error()).toBe('E-Mail already taken');
    expect(state.success()).toBeNull();
  });

  it('setSuccess() sets the success message and clears isLoading', () => {
    const state = TestBed.runInInjectionContext(() => createFormState());
    state.start();
    state.setSuccess('Erfolgreich gespeichert');

    expect(state.isLoading()).toBe(false);
    expect(state.success()).toBe('Erfolgreich gespeichert');
    expect(state.error()).toBeNull();
  });

  it('reset() clears all state', () => {
    const state = TestBed.runInInjectionContext(() => createFormState());
    state.setError('some error');
    state.reset();

    expect(state.isLoading()).toBe(false);
    expect(state.error()).toBeNull();
    expect(state.success()).toBeNull();
  });
});
