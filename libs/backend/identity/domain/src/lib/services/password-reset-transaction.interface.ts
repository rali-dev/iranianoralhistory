/**
 * Port für einen atomaren Passwort-Reset (Unit-of-Work).
 *
 * Der Reset besteht aus zwei Schreibvorgängen: das Reset-Token invalidieren
 * UND das neue Passwort setzen. Laufen sie unabhängig, kann ein Fehler nach
 * dem ersten Write einen inkonsistenten Zustand hinterlassen. Dieser Port
 * kapselt beide Writes in EINER Datenbank-Transaktion — entweder beide oder
 * keiner. Die Application-Schicht hängt an dieser Abstraktion (injiziert über
 * PASSWORD_RESET_TX), die Infrastruktur implementiert sie via Prisma
 * `$transaction`.
 */
export interface IPasswordResetTransaction {
  /**
   * Löscht atomar das Reset-Token des Nutzers und setzt sein neues (bereits
   * gehashtes) Passwort. All-or-nothing.
   */
  commitReset(userId: string, hashedPassword: string): Promise<void>;
}

export const PASSWORD_RESET_TX = Symbol('PASSWORD_RESET_TX');
