/**
 * Basis-Exception der Domänenschicht.
 *
 * Lebt im Shared-Kernel (contracts), damit JEDE Domain (identity, video, …)
 * sie werfen kann. Der globale DomainExceptionFilter fängt sie und mappt auf
 * HTTP 400 — so wird eine verletzte Invariante NIE zu einem HTTP 500.
 */
export class DomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainException';
  }
}
