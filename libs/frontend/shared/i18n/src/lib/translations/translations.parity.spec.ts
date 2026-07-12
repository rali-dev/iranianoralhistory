import { de } from './de';
import { en } from './en';
import { fa } from './fa';

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
