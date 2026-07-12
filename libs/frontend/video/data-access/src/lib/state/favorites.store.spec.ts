import { favoritesStore } from './favorites.store';

describe('favoritesStore', () => {
  beforeEach(() => {
    favoritesStore.setIds([]);
  });

  describe('initial state', () => {
    it('ids is an empty Set', () => {
      expect(favoritesStore.ids().size).toBe(0);
    });

    it('count is 0', () => {
      expect(favoritesStore.count()).toBe(0);
    });
  });

  describe('setIds()', () => {
    it('sets multiple IDs at once', () => {
      favoritesStore.setIds(['v-1', 'v-2', 'v-3']);

      expect(favoritesStore.ids().size).toBe(3);
      expect(favoritesStore.ids().has('v-1')).toBe(true);
      expect(favoritesStore.count()).toBe(3);
    });

    it('replaces the existing state', () => {
      favoritesStore.setIds(['v-1', 'v-2']);
      favoritesStore.setIds(['v-99']);

      expect(favoritesStore.ids().size).toBe(1);
      expect(favoritesStore.ids().has('v-99')).toBe(true);
      expect(favoritesStore.ids().has('v-1')).toBe(false);
    });

    it('resets to an empty list', () => {
      favoritesStore.setIds(['v-1']);
      favoritesStore.setIds([]);

      expect(favoritesStore.ids().size).toBe(0);
    });
  });

  describe('add()', () => {
    it('adds a video ID', () => {
      favoritesStore.add('v-1');

      expect(favoritesStore.ids().has('v-1')).toBe(true);
      expect(favoritesStore.count()).toBe(1);
    });

    it('ignores duplicates (Set semantics)', () => {
      favoritesStore.add('v-1');
      favoritesStore.add('v-1');

      expect(favoritesStore.count()).toBe(1);
    });

    it('adds multiple distinct IDs', () => {
      favoritesStore.add('v-1');
      favoritesStore.add('v-2');

      expect(favoritesStore.count()).toBe(2);
    });
  });

  describe('remove()', () => {
    it('removes a video ID', () => {
      favoritesStore.setIds(['v-1', 'v-2']);
      favoritesStore.remove('v-1');

      expect(favoritesStore.ids().has('v-1')).toBe(false);
      expect(favoritesStore.ids().has('v-2')).toBe(true);
      expect(favoritesStore.count()).toBe(1);
    });

    it('does not throw when the ID is not in the set', () => {
      expect(() => favoritesStore.remove('not-present')).not.toThrow();
    });
  });

  describe('computed: count', () => {
    it('counts correctly after add and remove', () => {
      favoritesStore.add('a');
      favoritesStore.add('b');
      expect(favoritesStore.count()).toBe(2);

      favoritesStore.remove('a');
      expect(favoritesStore.count()).toBe(1);
    });
  });
});
