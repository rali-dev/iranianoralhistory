/**
 * Fail-fast Validierung sicherheitskritischer Umgebungsvariablen.
 *
 * Wird ganz am Anfang von bootstrap() aufgerufen — noch bevor NestJS startet.
 * Fehlt ein Pflichtwert oder ist ein Signatur-Secret trivial/zu kurz, bricht
 * der Prozess mit klarer Fehlermeldung ab, statt in einem verwundbaren
 * Zustand (z. B. mit JWT_SECRET="secret") online zu gehen.
 */

const MIN_SECRET_LENGTH = 32; // 256 Bit
const WEAK_SECRETS = new Set([
  'secret',
  'refresh-secret',
  'changeme',
  'change-me',
  'password',
  'jwt-secret',
  'test-secret',
  'test-refresh-secret',
]);

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`[env] Pflicht-Umgebungsvariable ${name} fehlt oder ist leer.`);
  }
  return value;
}

function requireStrongSecret(name: string): string {
  const value = requireEnv(name);
  if (WEAK_SECRETS.has(value.toLowerCase())) {
    throw new Error(
      `[env] ${name} ist ein triviales Beispiel-Secret. Erzeuge einen starken Zufallswert: ` +
        `node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"`,
    );
  }
  if (value.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `[env] ${name} ist zu kurz (${value.length} Zeichen). Mindestens ${MIN_SECRET_LENGTH} Zeichen (256 Bit) erforderlich.`,
    );
  }
  return value;
}

/**
 * Prüft alle sicherheitskritischen Umgebungsvariablen.
 * @throws Error mit sprechender Meldung, wenn eine Bedingung verletzt ist.
 */
export function validateEnv(): void {
  requireEnv('DATABASE_URL');

  const jwtSecret = requireStrongSecret('JWT_SECRET');
  const jwtRefreshSecret = requireStrongSecret('JWT_REFRESH_SECRET');

  if (jwtSecret === jwtRefreshSecret) {
    throw new Error('[env] JWT_SECRET und JWT_REFRESH_SECRET müssen unterschiedlich sein.');
  }
}
