import { computed, signal } from '@angular/core';

const _ids = signal<Set<string>>(new Set());

export const favoritesStore = {
  ids: _ids.asReadonly(),
  count: computed(() => _ids().size),

  setIds(ids: string[]): void {
    _ids.set(new Set(ids));
  },

  add(id: string): void {
    _ids.update((s) => new Set([...s, id]));
  },

  remove(id: string): void {
    _ids.update((s) => {
      const next = new Set(s);
      next.delete(id);
      return next;
    });
  },
};
