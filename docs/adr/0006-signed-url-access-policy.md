# 6. Signed-URL access policy for private documents

- Status: Superseded by [ADR-0008](./0008-public-signed-url-access.md)
- Date: 2026-07-13
- Deciders: Engineering

> **Superseded (2026-07-14):** The "public-after-login" gate below was reversed.
> Documents are now part of the fully public archive and are served **without
> login** — identical to the public video embeds. The storage layer stays
> private (short-lived Signed URLs only); enumeration resistance now rests on
> unguessable UUID `docId`s, 404-on-unknown, and the per-route rate limit. See
> [ADR-0008](./0008-public-signed-url-access.md) for the current policy. The
> record below is kept verbatim as historical context.

## Context

Source documents (transcripts, scans) attached to videos live in a **private** Supabase Storage
bucket — they must never be world-readable by guessing a public URL. At the same time, the archive's
editorial intent is that its content is **public-after-login**: any registered visitor may read the
documents attached to a published testimony. The documents are scholarly primary sources, not
per-user private data. We need an access rule that is private at the storage layer but open to any
authenticated reader, while resisting trivial enumeration of `docId`s.

## Decision

Serve documents via **time-limited Signed URLs**, gated by authentication, with this policy:

- The bucket stays private. The API never proxies file bytes.
- `GET /api/documents/:docId/signed-url` requires a valid session (`JwtAuthGuard`). **Any**
  authenticated user — role `USER` is sufficient — may request a signed URL for a published archive
  document. This is intentional: archive content is public-after-login, not per-user private.
- On success the endpoint issues a short-lived Supabase Signed URL and returns **HTTP 302** to it;
  the browser fetches the bytes directly from storage.
- Unknown `docId`s return **404** (no existence oracle beyond what the catalogue already lists), and
  the route is **per-route rate-limited** to deter enumeration.
- `RolesGuard` + `@Roles('ADMIN')` can be layered onto this route later for admin-only assets
  without changing the mechanism — the controller already notes this extension point.

## Consequences

**Positive**
- Files are never publicly guessable, yet legitimate readers get them with no API bandwidth cost.
- Signed URLs expire, so a shared or logged link stops working quickly.
- The policy is explicit and centralized: "authenticated ⇒ may read published documents", easy to
  tighten to admin-only per route.

**Negative / trade-offs**
- Any authenticated user can fetch any published document's URL; if some documents later need to be
  restricted, they require the `RolesGuard` layer or a per-document ACL — not covered today.
- A 302 to an external, expiring URL is slightly awkward for API clients that don't follow redirects;
  documented in the OpenAPI spec.

**Neutral**
- Enumeration resistance rests on 404-on-unknown plus rate limiting, not on secret `docId`s — the
  catalogue already exposes valid ids to logged-in users by design.
