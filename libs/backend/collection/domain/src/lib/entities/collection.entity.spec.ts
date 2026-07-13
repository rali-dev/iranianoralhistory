import { DomainException } from '@iranianoralhistory/shared-contracts';
import { CollectionEntity } from './collection.entity';

function buildCollection(): CollectionEntity {
  return new CollectionEntity(
    'col-uuid',
    'person-ali-rahimi',
    'PERSON',
    { de: 'Ali Rahimi', en: 'Ali Rahimi', fa: 'علی رحیمی' },
    { de: 'Beschreibung', en: 'Description', fa: 'توضیح' },
    0,
    5,
    new Date('2024-01-01'),
    new Date('2024-06-01'),
  );
}

describe('CollectionEntity', () => {
  describe('getName()', () => {
    it('returns the German name', () => {
      expect(buildCollection().getName('de')).toBe('Ali Rahimi');
    });

    it('returns the English name', () => {
      expect(buildCollection().getName('en')).toBe('Ali Rahimi');
    });

    it('returns the Farsi name', () => {
      expect(buildCollection().getName('fa')).toBe('علی رحیمی');
    });
  });

  describe('getDescription()', () => {
    it('returns the German description', () => {
      expect(buildCollection().getDescription('de')).toBe('Beschreibung');
    });

    it('returns the Farsi description', () => {
      expect(buildCollection().getDescription('fa')).toBe('توضیح');
    });

    it('returns null when description is null', () => {
      const col = new CollectionEntity(
        'col-2',
        'topic-iran',
        'TOPIC',
        { de: 'Iran', en: 'Iran', fa: 'ایران' },
        null,
        1,
        0,
        new Date(),
        new Date(),
      );
      expect(col.getDescription('de')).toBeNull();
      expect(col.getDescription('en')).toBeNull();
      expect(col.getDescription('fa')).toBeNull();
    });
  });

  it('exposes all constructor values as readonly properties', () => {
    const col = buildCollection();
    expect(col.id).toBe('col-uuid');
    expect(col.slug).toBe('person-ali-rahimi');
    expect(col.type).toBe('PERSON');
    expect(col.sortOrder).toBe(0);
    expect(col.videoCount).toBe(5);
  });

  describe('create()', () => {
    const validInput = {
      slug: 'person-ali',
      type: 'PERSON' as const,
      name: { de: 'Ali', en: 'Ali', fa: 'علی' },
      description: null,
      sortOrder: 0,
    };

    it('builds an unpersisted collection with placeholder id/videoCount', () => {
      const col = CollectionEntity.create(validInput);
      expect(col).toBeInstanceOf(CollectionEntity);
      expect(col.id).toBe('');
      expect(col.videoCount).toBe(0);
      expect(col.slug).toBe('person-ali');
      expect(col.type).toBe('PERSON');
      expect(col.name).toEqual({ de: 'Ali', en: 'Ali', fa: 'علی' });
      expect(col.description).toBeNull();
    });

    it('trims surrounding whitespace from the slug', () => {
      expect(CollectionEntity.create({ ...validInput, slug: '  person-ali  ' }).slug).toBe(
        'person-ali',
      );
    });

    it('keeps a provided description', () => {
      const col = CollectionEntity.create({
        ...validInput,
        description: { de: 'D', en: 'E', fa: 'ف' },
      });
      expect(col.description).toEqual({ de: 'D', en: 'E', fa: 'ف' });
    });

    it('throws on an empty or whitespace-only slug', () => {
      expect(() => CollectionEntity.create({ ...validInput, slug: '' })).toThrow(DomainException);
      expect(() => CollectionEntity.create({ ...validInput, slug: '   ' })).toThrow(
        /slug must not be empty/,
      );
    });

    it('throws on an invalid collection type', () => {
      expect(() =>
        CollectionEntity.create({ ...validInput, type: 'ANIMAL' as never }),
      ).toThrow(/Invalid collection type/);
    });

    it('throws when a name language is blank', () => {
      expect(() =>
        CollectionEntity.create({ ...validInput, name: { de: 'Ali', en: '  ', fa: 'علی' } }),
      ).toThrow(/name \(en\) must not be blank/);
    });

    it('throws on a negative sortOrder', () => {
      expect(() => CollectionEntity.create({ ...validInput, sortOrder: -1 })).toThrow(
        /sortOrder must be a non-negative integer/,
      );
    });
  });

  describe('assertValidUpdate()', () => {
    it('accepts an empty patch', () => {
      expect(() => CollectionEntity.assertValidUpdate({})).not.toThrow();
    });

    it('accepts a valid partial name patch', () => {
      expect(() => CollectionEntity.assertValidUpdate({ name: { de: 'Neu' } })).not.toThrow();
    });

    it('throws on a blank slug', () => {
      expect(() => CollectionEntity.assertValidUpdate({ slug: '   ' })).toThrow(
        /slug must not be empty/,
      );
    });

    it('throws when a provided name language is blanked out', () => {
      expect(() => CollectionEntity.assertValidUpdate({ name: { fa: '' } })).toThrow(
        /name \(fa\) must not be blank/,
      );
    });

    it('throws on a negative sortOrder', () => {
      expect(() => CollectionEntity.assertValidUpdate({ sortOrder: -3 })).toThrow(
        /sortOrder must be a non-negative integer/,
      );
    });
  });
});
