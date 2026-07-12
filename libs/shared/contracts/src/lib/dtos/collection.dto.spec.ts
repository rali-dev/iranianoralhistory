import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateCollectionDto, UpdateCollectionDto, AssignVideoDto } from './collection.dto';

function failedProps<T extends object>(cls: new () => T, payload: unknown): string[] {
  const dto = plainToInstance(cls, payload);
  return validateSync(dto as object, { whitelist: true }).map((e) => e.property);
}

const validName = { de: 'DE', en: 'EN', fa: 'FA' };

describe('collection DTO validation', () => {
  describe('CreateCollectionDto', () => {
    it('accepts a valid slug + type + trilingual name', () => {
      expect(failedProps(CreateCollectionDto, { slug: 'a-person', type: 'PERSON', name: validName })).toEqual([]);
    });

    // Regression: vor dem Fix trug `name` kein @ValidateNested/@Type — eine
    // unvollständige mehrsprachige Bezeichnung passierte die Validierung.
    it('rejects a name that is missing a language (nested validation now fires)', () => {
      expect(
        failedProps(CreateCollectionDto, { slug: 'a-person', type: 'PERSON', name: { de: 'DE', en: 'EN' } }),
      ).toContain('name');
    });

    it('rejects an empty name object', () => {
      expect(failedProps(CreateCollectionDto, { slug: 'a-person', type: 'PERSON', name: {} })).toContain('name');
    });

    it('rejects an invalid collection type', () => {
      expect(failedProps(CreateCollectionDto, { slug: 'a-person', type: 'ANIMAL', name: validName })).toContain('type');
    });

    it('rejects a negative sortOrder', () => {
      expect(
        failedProps(CreateCollectionDto, { slug: 'a-person', type: 'TOPIC', name: validName, sortOrder: -1 }),
      ).toContain('sortOrder');
    });

    it('rejects a description that is missing a language', () => {
      expect(
        failedProps(CreateCollectionDto, {
          slug: 'a-person',
          type: 'TOPIC',
          name: validName,
          description: { de: 'DE', fa: 'FA' },
        }),
      ).toContain('description');
    });
  });

  describe('UpdateCollectionDto', () => {
    it('accepts an empty patch', () => {
      expect(failedProps(UpdateCollectionDto, {})).toEqual([]);
    });

    it('accepts a partial name patch (optional languages)', () => {
      expect(failedProps(UpdateCollectionDto, { name: { de: 'nur DE' } })).toEqual([]);
    });
  });

  describe('AssignVideoDto', () => {
    it('requires a non-empty videoId', () => {
      expect(failedProps(AssignVideoDto, {})).toContain('videoId');
      expect(failedProps(AssignVideoDto, { videoId: 'v-1' })).toEqual([]);
    });
  });
});
