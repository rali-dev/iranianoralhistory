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
});
