import { buildTranslation, buildOptionalTranslation } from './translation.utils';

describe('buildTranslation()', () => {
  it('returns an object with all three languages', () => {
    const result = buildTranslation('Hallo', 'Hello', 'سلام');
    expect(result).toEqual({ de: 'Hallo', en: 'Hello', fa: 'سلام' });
  });

  it('trims whitespace from all values', () => {
    const result = buildTranslation('  Hallo  ', '  Hello  ', '  سلام  ');
    expect(result).toEqual({ de: 'Hallo', en: 'Hello', fa: 'سلام' });
  });
});

describe('buildOptionalTranslation()', () => {
  it('returns an object when at least one value is non-empty', () => {
    expect(buildOptionalTranslation('Text', '', '')).toEqual({ de: 'Text', en: '', fa: '' });
    expect(buildOptionalTranslation('', 'Text', '')).toEqual({ de: '', en: 'Text', fa: '' });
    expect(buildOptionalTranslation('', '', 'متن')).toEqual({ de: '', en: '', fa: 'متن' });
  });

  it('returns undefined when all values are empty or whitespace only', () => {
    expect(buildOptionalTranslation('', '', '')).toBeUndefined();
    expect(buildOptionalTranslation('  ', '  ', '  ')).toBeUndefined();
  });

  it('trims whitespace before deciding whether to return undefined', () => {
    expect(buildOptionalTranslation('  ', '', '')).toBeUndefined();
    expect(buildOptionalTranslation('  Text  ', '', '')).toEqual({ de: 'Text', en: '', fa: '' });
  });
});
