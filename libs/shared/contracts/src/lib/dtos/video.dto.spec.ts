import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateVideoDto, UpdateVideoDto } from './video.dto';

function failedProps<T extends object>(cls: new () => T, payload: unknown): string[] {
  const dto = plainToInstance(cls, payload);
  return validateSync(dto as object, { whitelist: true }).map((e) => e.property);
}

describe('video DTO validation', () => {
  describe('CreateVideoDto', () => {
    it('accepts a valid vimeoId + full trilingual title', () => {
      expect(
        failedProps(CreateVideoDto, { vimeoId: '123456789', title: { de: 'DE', en: 'EN', fa: 'FA' } }),
      ).toEqual([]);
    });

    it('rejects a title that is missing a language (nested validation fires)', () => {
      expect(
        failedProps(CreateVideoDto, { vimeoId: '123456789', title: { de: 'DE', en: 'EN' } }),
      ).toContain('title');
    });

    it('rejects a title with an empty-string language', () => {
      expect(
        failedProps(CreateVideoDto, { vimeoId: '123456789', title: { de: 'DE', en: '', fa: 'FA' } }),
      ).toContain('title');
    });

    it('rejects a missing title', () => {
      expect(failedProps(CreateVideoDto, { vimeoId: '123456789' })).toContain('title');
    });

    it('accepts an omitted (optional) description', () => {
      expect(
        failedProps(CreateVideoDto, { vimeoId: '123456789', title: { de: 'DE', en: 'EN', fa: 'FA' } }),
      ).not.toContain('description');
    });
  });

  describe('UpdateVideoDto', () => {
    it('accepts an empty patch (everything optional)', () => {
      expect(failedProps(UpdateVideoDto, {})).toEqual([]);
    });

    it('accepts a partial title patch (optional languages)', () => {
      expect(failedProps(UpdateVideoDto, { title: { de: 'nur DE' } })).toEqual([]);
    });
  });
});
