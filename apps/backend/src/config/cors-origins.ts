/**
 * Ermittelt die erlaubten CORS-Origins aus der Umgebung.
 *
 * `CORS_ORIGINS` ist eine kommaseparierte Liste (z. B.
 * "https://archiv.example.org,https://www.example.org"). Ist die Variable
 * nicht gesetzt, wird auf den lokalen Dev-Origin zurückgefallen — so bleibt
 * die Entwicklung ohne Konfiguration lauffähig, während Produktion die
 * Origins explizit und ohne Code-Änderung steuert.
 */
export const DEFAULT_CORS_ORIGIN = 'http://localhost:4200';

export function parseCorsOrigins(raw: string | undefined): string[] {
  if (!raw || raw.trim() === '') {
    return [DEFAULT_CORS_ORIGIN];
  }
  const origins = raw
    .split(',')
    .map((o) => o.trim())
    .filter((o) => o.length > 0);

  return origins.length > 0 ? origins : [DEFAULT_CORS_ORIGIN];
}
