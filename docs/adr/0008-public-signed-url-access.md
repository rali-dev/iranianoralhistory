# 8. Public signed-URL access for archive documents

- Status: Accepted
- Date: 2026-07-14
- Deciders: Engineering
- Supersedes: [ADR-0006](./0006-signed-url-access-policy.md)

## Context

[ADR-0006](./0006-signed-url-access-policy.md) gated `GET /api/documents/:docId/signed-url` behind
`JwtAuthGuard` ("public-after-login"). In practice this created an inconsistent, surprising archive:
the videos of a testimony play for **any** visitor (public Vimeo embeds, unguarded `GET /videos`),
but the source documents attached to the very same testimony returned **401** to a guest and simply
failed to open. For a public scholarly archive whose editorial intent is open access to its primary
sources, requiring a login only for the documents (and not the videos) is the wrong default: it is a
friction point, not a protection — the document contents are meant to be public.

The storage-layer concern from ADR-0006 still holds: the bucket must stay private and the API must
never proxy file bytes or expose a guessable public URL.

## Decision

Serve documents as part of the **fully public archive**, on par with the videos:

- `GET /api/documents/:docId/signed-url` carries **no auth guard** — guests and logged-in users
  alike receive the redirect. This mirrors the public `GET /videos` reads.
- The bucket stays **private**. The endpoint issues a short-lived Supabase Signed URL (default
  **3600s**) and returns **HTTP 302** to it; the browser fetches the bytes directly from storage.
  Only the ephemeral signed URL is ever public, never a durable bucket URL.
- Unknown `docId`s return **404** (no existence oracle), and the route keeps its tight
  **per-route rate limit** (`@Throttle` — 30 requests / 60s, on top of the global 100/min
  `ThrottlerGuard`) to deter enumeration.
- Enumeration resistance rests on **unguessable UUID `docId`s** (Prisma `@default(uuid())`) plus the
  404-on-unknown behaviour and the rate limit — no secret is required, but no id is guessable either.
- `JwtAuthGuard` + `RolesGuard` + `@Roles('ADMIN')` can still be layered onto this route later for a
  future admin-only asset class **without changing the mechanism** — the controller notes this
  extension point.

## Consequences

**Positive**
- The archive is consistent: a guest who can watch a testimony can also open its documents. Problem
  solved without a login wall on public scholarship.
- Files remain non-guessable and never world-readable at the storage layer; signed URLs expire, so a
  shared or logged link stops working quickly.

**Negative / trade-offs**
- The signed-url endpoint is now reachable by anyone. The mitigations (UUID ids, 404-on-unknown,
  30/60s throttle, short expiry) are deliberately the *only* barrier; if a future document class must
  be restricted, it needs the `RolesGuard` layer or a per-document ACL — not covered today.
- A 302 to an external, expiring URL is slightly awkward for API clients that don't follow redirects;
  documented in the OpenAPI spec (`security: []`).

**Neutral**
- Mutations on documents (`POST` / `PATCH` / `DELETE` under `/api/videos/:id/documents`) are
  **unchanged** — still `JwtAuthGuard` + `RolesGuard('ADMIN')`. Only the read/download path became
  public.
