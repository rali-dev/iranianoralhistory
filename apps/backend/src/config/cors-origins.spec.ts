import { parseCorsOrigins, DEFAULT_CORS_ORIGIN } from './cors-origins';

describe('parseCorsOrigins', () => {
  it('falls back to the local dev origin when unset', () => {
    expect(parseCorsOrigins(undefined)).toEqual([DEFAULT_CORS_ORIGIN]);
  });

  it('falls back to the local dev origin when empty/whitespace', () => {
    expect(parseCorsOrigins('')).toEqual([DEFAULT_CORS_ORIGIN]);
    expect(parseCorsOrigins('   ')).toEqual([DEFAULT_CORS_ORIGIN]);
  });

  it('parses a single origin', () => {
    expect(parseCorsOrigins('https://archiv.example.org')).toEqual([
      'https://archiv.example.org',
    ]);
  });

  it('parses a comma-separated list and trims whitespace', () => {
    expect(
      parseCorsOrigins('https://a.example.org, https://b.example.org ,https://c.example.org'),
    ).toEqual([
      'https://a.example.org',
      'https://b.example.org',
      'https://c.example.org',
    ]);
  });

  it('drops empty segments from a sloppy list', () => {
    expect(parseCorsOrigins('https://a.example.org,,')).toEqual([
      'https://a.example.org',
    ]);
  });
});
