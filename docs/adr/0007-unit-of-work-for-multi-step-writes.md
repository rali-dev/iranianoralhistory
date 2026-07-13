# 7. Unit-of-work (Prisma `$transaction`) for multi-step writes

- Status: Accepted
- Date: 2026-07-13
- Deciders: Engineering

## Context

Some use-cases mutate more than one row and must be **all-or-nothing**. The clearest example is
password reset: it must (1) delete the consumed `PasswordResetToken` row and (2) set the user's new
password hash. If step 1 succeeds and step 2 fails, the token is gone but the password is unchanged —
the user is locked out of their own reset. If step 2 succeeds and step 1 fails, the one-time code
remains valid and replayable. Neither partial outcome is acceptable, and the application layer must
not depend on Prisma directly (the dependency rule forbids `application → infrastructure`).

## Decision

Wrap multi-step writes in a **single Prisma `$transaction`**, exposed to the application layer as a
domain **port** — `PASSWORD_RESET_TX` — implemented in infrastructure.

- The application handler (`ResetPasswordCommand`) calls the port; it does not know a transaction is
  involved. It sees one atomic operation.
- The infrastructure implementation runs delete-token + set-password inside `$transaction`, so both
  commit together or both roll back.
- The pattern generalizes: any future use-case needing atomic multi-row writes gets its own
  transactional port rather than reaching for the ORM in the wrong layer.

## Consequences

**Positive**
- Password reset is atomic: no lock-out, no replayable code.
- The Clean-Architecture boundary holds — the application layer talks to a port, and the
  transaction detail stays in infrastructure.
- Testable: the port can be substituted with a fake in unit tests.

**Negative / trade-offs**
- A new abstraction per atomic use-case is more moving parts than calling `$transaction` inline —
  accepted as the cost of keeping the dependency rule intact.
- Transaction scope must be kept tight; long-running work inside `$transaction` holds locks.

**Neutral**
- Single-row writes need no such port and continue to go through the ordinary repository ports.
