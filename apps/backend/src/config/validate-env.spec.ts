import { validateEnv } from './validate-env';

const STRONG_A = 'A'.repeat(32) + 'b3/9+xZq'; // 40 Zeichen, kein Beispielwert
const STRONG_B = 'C'.repeat(32) + 'k7-2+wLp'; // 40 Zeichen, verschieden von A

describe('validateEnv()', () => {
  const ORIGINAL = { ...process.env };

  beforeEach(() => {
    process.env['DATABASE_URL'] = 'postgresql://user:pass@localhost:5432/db';
    process.env['JWT_SECRET'] = STRONG_A;
    process.env['JWT_REFRESH_SECRET'] = STRONG_B;
    process.env['SUPABASE_URL'] = 'https://test.supabase.co';
    process.env['SUPABASE_SECRET_KEY'] = 'supabase-secret-key';
    process.env['SUPABASE_BUCKET'] = 'test-bucket';
    process.env['RESEND_API_KEY'] = 're_test_key';
  });

  afterEach(() => {
    process.env = { ...ORIGINAL };
  });

  it('passes with strong, distinct secrets and a database url', () => {
    expect(() => validateEnv()).not.toThrow();
  });

  it('throws when DATABASE_URL is missing', () => {
    delete process.env['DATABASE_URL'];
    expect(() => validateEnv()).toThrow(/DATABASE_URL/);
  });

  it('throws when a JWT secret is missing', () => {
    delete process.env['JWT_SECRET'];
    expect(() => validateEnv()).toThrow(/JWT_SECRET/);
  });

  it('rejects a trivial example secret', () => {
    process.env['JWT_SECRET'] = 'secret';
    expect(() => validateEnv()).toThrow(/triviales/);
  });

  it('rejects a secret that is too short', () => {
    process.env['JWT_SECRET'] = 'short-but-not-in-blocklist';
    expect(() => validateEnv()).toThrow(/zu kurz/);
  });

  it('rejects identical access and refresh secrets', () => {
    process.env['JWT_REFRESH_SECRET'] = STRONG_A;
    expect(() => validateEnv()).toThrow(/unterschiedlich/);
  });

  it('throws when SUPABASE_SECRET_KEY is missing', () => {
    delete process.env['SUPABASE_SECRET_KEY'];
    expect(() => validateEnv()).toThrow(/SUPABASE_SECRET_KEY/);
  });

  it('throws when RESEND_API_KEY is missing', () => {
    delete process.env['RESEND_API_KEY'];
    expect(() => validateEnv()).toThrow(/RESEND_API_KEY/);
  });
});
