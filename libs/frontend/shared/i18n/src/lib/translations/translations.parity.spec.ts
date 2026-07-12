import { de } from './de';
import { en } from './en';
import { fa } from './fa';
import { KNOWN_INCOMPLETE_TRANSLATION_KEYS } from './incomplete-translations.baseline';

/**
 * A translation node is either a leaf (string) or a nested object of nodes.
 */
type TranslationNode = string | { [key: string]: TranslationNode };

/**
 * Flatten a translation object into its list of dotted key-paths.
 * A leaf is a string; nested objects are recursed into.
 */
function flattenKeys(node: TranslationNode, prefix = ''): string[] {
  if (typeof node !== 'object' || node === null) {
    return prefix ? [prefix] : [];
  }
  return Object.keys(node)
    .sort()
    .flatMap((key) => {
      const path = prefix ? `${prefix}.${key}` : key;
      return flattenKeys(node[key], path);
    });
}

/**
 * Flatten a translation object into [dotted-key-path, leaf-value] entries.
 */
function flattenEntries(
  node: TranslationNode,
  prefix = '',
): Array<[string, TranslationNode]> {
  if (typeof node !== 'object' || node === null) {
    return prefix ? [[prefix, node]] : [];
  }
  return Object.keys(node)
    .sort()
    .flatMap((key) => {
      const path = prefix ? `${prefix}.${key}` : key;
      return flattenEntries(node[key], path);
    });
}

function keySet(obj: TranslationNode): Set<string> {
  return new Set(flattenKeys(obj));
}

/** Keys present in `a` but missing from `b`, sorted for stable messages. */
function difference(a: Set<string>, b: Set<string>): string[] {
  return [...a].filter((key) => !b.has(key)).sort();
}

describe('translation key parity', () => {
  const deKeys = keySet(de);
  const enKeys = keySet(en);
  const faKeys = keySet(fa);

  it('de exposes a non-empty set of key-paths', () => {
    expect(deKeys.size).toBeGreaterThan(0);
  });

  it('en has exactly the same key-paths as de', () => {
    const missingInEn = difference(deKeys, enKeys); // in de, absent from en
    const extraInEn = difference(enKeys, deKeys); // in en, absent from de

    expect({ missingInEn, extraInEn }).toEqual({
      missingInEn: [],
      extraInEn: [],
    });
  });

  it('fa has exactly the same key-paths as de', () => {
    const missingInFa = difference(deKeys, faKeys); // in de, absent from fa
    const extraInFa = difference(faKeys, deKeys); // in fa, absent from de

    expect({ missingInFa, extraInFa }).toEqual({
      missingInFa: [],
      extraInFa: [],
    });
  });

  it('all three languages share the same key count', () => {
    expect(enKeys.size).toBe(deKeys.size);
    expect(faKeys.size).toBe(deKeys.size);
  });
});

describe('translation leaf values', () => {
  const languages: Array<[string, TranslationNode]> = [
    ['de', de],
    ['en', en],
    ['fa', fa],
  ];

  // Every leaf must resolve to a string. Empty strings are intentionally used
  // in the source data as placeholders for content rendered elsewhere, so an
  // empty value is allowed here; a non-string leaf (number/array/object) is not.
  for (const [name, obj] of languages) {
    it(`every ${name} leaf is a string`, () => {
      const nonStringKeys = flattenEntries(obj)
        .filter(([, value]) => typeof value !== 'string')
        .map(([key]) => key);

      expect(nonStringKeys).toEqual([]);
    });
  }
});

/**
 * Cross-language completeness ratchet.
 *
 * The parity checks above prove the three languages share the same KEYS, but a
 * key can still be a blank string in one language while filled in another — that
 * is exactly the defect that leaves ~30 % of the German/English UI empty. Deep
 * value-equality is deliberately NOT asserted (translations must differ), but a
 * key that is filled somewhere and blank elsewhere is a genuine content gap.
 *
 * We freeze the current gap set in `incomplete-translations.baseline.ts` so the
 * suite stays green today, and ratchet from there: no NEW gap may appear, and a
 * key that gets filled must be removed from the baseline. See that file.
 */
describe('translation completeness (cross-language)', () => {
  const deMap = Object.fromEntries(flattenEntries(de));
  const enMap = Object.fromEntries(flattenEntries(en));
  const faMap = Object.fromEntries(flattenEntries(fa));
  const allKeys = flattenKeys(de);

  const isBlank = (value: TranslationNode | undefined): boolean =>
    value === undefined || value === null || value === '';

  // A key is "incomplete" when it is filled in at least one language and blank
  // in at least one other.
  const incompleteKeys = allKeys
    .filter((key) => {
      const values = [deMap[key], enMap[key], faMap[key]];
      return values.some(isBlank) && values.some((v) => !isBlank(v));
    })
    .sort();

  const baseline = new Set(KNOWN_INCOMPLETE_TRANSLATION_KEYS);

  it('introduces no NEW cross-language gap beyond the frozen baseline', () => {
    const newlyIncomplete = incompleteKeys.filter((key) => !baseline.has(key));
    // If this fails: a translation key is now filled in one language but blank
    // in another. Fill all three languages (or add it to the baseline knowingly).
    expect(newlyIncomplete).toEqual([]);
  });

  it('keeps the baseline honest — no already-completed key may linger in it', () => {
    const staleBaseline = [...baseline].filter((key) => !incompleteKeys.includes(key)).sort();
    // If this fails: a key listed as incomplete is now complete. Remove it from
    // incomplete-translations.baseline.ts so the debt register shrinks to zero.
    expect(staleBaseline).toEqual([]);
  });
});
