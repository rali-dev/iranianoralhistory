# 5. Cookie-based JWT with refresh rotation

- Status: Accepted
- Date: 2026-07-13
- Deciders: Engineering

## Context

The SPA needs authenticated sessions against the API. Storing JWTs in `localStorage` or any
JS-readable place exposes them to XSS token theft. We also want short-lived credentials (to bound
the damage of a leak) without forcing the user to re-enter a password every few minutes, and we want
a stored refresh secret that is useless to an attacker who reads the database.

## Decision

Use **Passport JWT delivered in httpOnly cookies**, with an access/refresh split and rotation.

- **Access token**: cookie `access_token`, ~15 min lifetime, sent on every request; verified by
  `JwtAuthGuard`.
- **Refresh token**: cookie `refresh_token`, ~7 day lifetime; verified by `JwtRefreshGuard` on
  `POST /api/auth/refresh`, which mints a new token pair and rotates both cookies.
- Cookies are `httpOnly`, `sameSite: 'strict'`, and `secure` in production — invisible to JS,
  not sent cross-site.
- The refresh token is stored **hashed** in the DB (`User.hashedRefreshToken`); refresh compares the
  presented token against the stored hash, so a database read alone cannot forge a session.
- Passwords are hashed with **bcrypt**.
- **Password reset** performs delete-before-write: the reset token row is deleted and the new
  password hash set within one transaction, so a code cannot be replayed (atomicity per ADR-0007).
- `validateEnv()` fails startup if `JWT_SECRET` / `JWT_REFRESH_SECRET` are missing, trivial, under
  32 chars, or identical.

## Consequences

**Positive**
- XSS cannot read the tokens; `sameSite: strict` blunts CSRF for state-changing cross-site requests.
- A short access lifetime bounds exposure; refresh keeps the UX seamless.
- A leaked database gives an attacker only refresh *hashes*, not usable tokens.

**Negative / trade-offs**
- Cookie auth ties clients to a browser cookie jar; non-browser API consumers must manage cookies
  explicitly (the OpenAPI security scheme documents this).
- Two secrets and their strength/uniqueness rules add configuration surface — mitigated by the
  fail-fast env check.

**Neutral**
- Logout clears both cookies and the server-side refresh hash; the access token remains valid until
  its short TTL expires (accepted, given the 15-minute window).
