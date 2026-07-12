import { TestBed } from '@angular/core/testing';
import { createDeleteConfirmState } from './delete-confirm-state';

describe('createDeleteConfirmState()', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('starts with confirmId=null and deletingId=null', () => {
    const state = TestBed.runInInjectionContext(() => createDeleteConfirmState());
    expect(state.confirmId()).toBeNull();
    expect(state.deletingId()).toBeNull();
  });

  it('ask() sets the confirmId', () => {
    const state = TestBed.runInInjectionContext(() => createDeleteConfirmState());
    state.ask('item-uuid');
    expect(state.confirmId()).toBe('item-uuid');
    expect(state.deletingId()).toBeNull();
  });

  it('cancel() clears the confirmId', () => {
    const state = TestBed.runInInjectionContext(() => createDeleteConfirmState());
    state.ask('item-uuid');
    state.cancel();
    expect(state.confirmId()).toBeNull();
  });

  it('begin() clears confirmId and sets deletingId', () => {
    const state = TestBed.runInInjectionContext(() => createDeleteConfirmState());
    state.ask('item-uuid');
    state.begin('item-uuid');
    expect(state.confirmId()).toBeNull();
    expect(state.deletingId()).toBe('item-uuid');
  });

  it('done() clears deletingId', () => {
    const state = TestBed.runInInjectionContext(() => createDeleteConfirmState());
    state.begin('item-uuid');
    state.done();
    expect(state.deletingId()).toBeNull();
  });
});
