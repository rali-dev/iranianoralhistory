import { VideoEntity } from './video.entity';
import { VimeoId } from '../value-objects/vimeo-id.value-object';

function buildVideo(overrides: Partial<{
  description: { de: string; en: string; fa: string } | null;
}> = {}): VideoEntity {
  return new VideoEntity(
    'video-uuid-1',
    VimeoId.create('123456789'),
    { de: 'Deutscher Titel', en: 'English Title', fa: 'عنوان فارسی' },
    overrides.description !== undefined
      ? overrides.description
      : { de: 'Deutsche Beschreibung', en: 'English Description', fa: 'توضیحات فارسی' },
    [],
    [],
    new Date('2024-01-01'),
    new Date('2024-01-01'),
  );
}

describe('VideoEntity', () => {
  describe('getTitle()', () => {
    it('returns the German title', () => {
      expect(buildVideo().getTitle('de')).toBe('Deutscher Titel');
    });

    it('returns the English title', () => {
      expect(buildVideo().getTitle('en')).toBe('English Title');
    });

    it('returns the Persian title', () => {
      expect(buildVideo().getTitle('fa')).toBe('عنوان فارسی');
    });
  });

  describe('getDescription()', () => {
    it('returns the description in the requested language', () => {
      expect(buildVideo().getDescription('de')).toBe('Deutsche Beschreibung');
      expect(buildVideo().getDescription('en')).toBe('English Description');
      expect(buildVideo().getDescription('fa')).toBe('توضیحات فارسی');
    });

    it('returns null when no description is set', () => {
      const video = buildVideo({ description: null });
      expect(video.getDescription('de')).toBeNull();
      expect(video.getDescription('fa')).toBeNull();
    });
  });

  describe('isRtl()', () => {
    it('returns true only for Persian (fa)', () => {
      const video = buildVideo();
      expect(video.isRtl('fa')).toBe(true);
    });

    it('returns false for German and English', () => {
      const video = buildVideo();
      expect(video.isRtl('de')).toBe(false);
      expect(video.isRtl('en')).toBe(false);
    });
  });

  describe('constructor', () => {
    it('stores the VimeoId correctly', () => {
      const video = buildVideo();
      expect(video.vimeoId.toString()).toBe('123456789');
    });

    it('initialises documents and collections as empty arrays', () => {
      const video = buildVideo();
      expect(video.documents).toHaveLength(0);
      expect(video.collections).toHaveLength(0);
    });
  });
});
