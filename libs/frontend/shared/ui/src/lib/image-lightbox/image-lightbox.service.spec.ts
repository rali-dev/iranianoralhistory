import { TestBed } from '@angular/core/testing';
import { ImageLightboxService } from './image-lightbox.service';

function createService(): ImageLightboxService {
  TestBed.configureTestingModule({});
  return TestBed.inject(ImageLightboxService);
}

describe('ImageLightboxService', () => {
  let service: ImageLightboxService;

  beforeEach(() => {
    service = createService();
  });

  describe('initial state', () => {
    it('has no image', () => {
      expect(service.image()).toBeNull();
    });

    it('is not open', () => {
      expect(service.isOpen()).toBe(false);
    });
  });

  describe('open()', () => {
    it('sets the image signal with src, caption and alt', () => {
      service.open('assets/photo.jpg', 'Eine Bildunterschrift', 'Alt-Text');

      expect(service.image()).toEqual({
        src: 'assets/photo.jpg',
        caption: 'Eine Bildunterschrift',
        alt: 'Alt-Text',
      });
    });

    it('marks the lightbox as open', () => {
      service.open('assets/photo.jpg', 'caption', 'alt');

      expect(service.isOpen()).toBe(true);
    });

    it('defaults alt to the caption when alt is omitted', () => {
      service.open('assets/photo.jpg', 'Nur eine Bildunterschrift');

      expect(service.image()?.alt).toBe('Nur eine Bildunterschrift');
      expect(service.image()).toEqual({
        src: 'assets/photo.jpg',
        caption: 'Nur eine Bildunterschrift',
        alt: 'Nur eine Bildunterschrift',
      });
    });

    it('uses the explicit alt over the caption when both are given', () => {
      service.open('assets/photo.jpg', 'caption', 'explicit alt');

      expect(service.image()?.alt).toBe('explicit alt');
    });

    it('replaces the previously opened image', () => {
      service.open('first.jpg', 'first');
      service.open('second.jpg', 'second', 'second alt');

      expect(service.image()).toEqual({
        src: 'second.jpg',
        caption: 'second',
        alt: 'second alt',
      });
      expect(service.isOpen()).toBe(true);
    });
  });

  describe('close()', () => {
    it('resets the image to null', () => {
      service.open('assets/photo.jpg', 'caption');
      service.close();

      expect(service.image()).toBeNull();
    });

    it('marks the lightbox as not open', () => {
      service.open('assets/photo.jpg', 'caption');
      service.close();

      expect(service.isOpen()).toBe(false);
    });

    it('is safe to call when already closed', () => {
      expect(() => service.close()).not.toThrow();
      expect(service.isOpen()).toBe(false);
    });
  });

  describe('open / close cycle', () => {
    it('can be reopened after being closed', () => {
      service.open('a.jpg', 'A');
      service.close();
      service.open('b.jpg', 'B');

      expect(service.isOpen()).toBe(true);
      expect(service.image()?.src).toBe('b.jpg');
    });
  });
});
