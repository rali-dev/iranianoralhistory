# Iranian Oral History — Engineering Documentation

A trilingual (Deutsch / English / فارسی) oral-history **video archive**. Scholars and the
public browse curated video testimonies, read the primary-source documents attached to them,
and — once signed in — save favourites. A small editorial team manages the catalogue through a
role-gated CMS.

This folder is the **authoritative engineering handbook** for the system. It documents the
architecture as it is built, the decisions that shaped it, and the HTTP contract the frontend
and any external client speak to.

---

## System at a glance

| Aspect            | Value |
|-------------------|-------|
| Monorepo          | Nx 22.7.5 |
| Backend           | `apps/backend` — NestJS 11, PORT `3222` (default), global prefix `/api` |
| Frontend          | `apps/frontend` — Angular 21 (zoneless, Signals, standalone), Tailwind CSS v4, dev port `4200` |
| Architecture      | DDD Modular Monolith + Clean Architecture (4 layers × 4 bounded contexts) |
| Persistence       | PostgreSQL via Prisma 7 (`PrismaPg` driver adapter) |
| AuthN / AuthZ     | Passport JWT in httpOnly cookies, bcrypt, RBAC (`USER` / `ADMIN`) |
| External services | Supabase Storage, Resend, Vimeo |
| Quality gates     | 723 Jest unit tests (33 projects) · 89 backend-e2e · 98 Playwright e2e · 0 lint errors |

---

## Contents

| Document | What it covers |
|----------|----------------|
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | The authoritative architecture: system context, the 4-layer model, bounded contexts, ESLint boundary rules, CQRS / events / value objects / ports, the request-and-guard lifecycle, cross-cutting concerns, and runtime topology. Contains the container and auth-flow diagrams. |
| [`openapi.yaml`](./openapi.yaml) | OpenAPI 3.1 specification of the whole `/api` surface — auth, users, videos, documents, collections, favorites, health. Cookie-based security scheme; trilingual DTO shapes. |
| [`adr/`](./adr/) | Architecture Decision Records (MADR style). The *why* behind the load-bearing choices. |

### Architecture Decision Records

| ADR | Decision |
|-----|----------|
| [0001](./adr/0001-modular-monolith-over-microservices.md) | Modular monolith over microservices |
| [0002](./adr/0002-cqrs-and-domain-events.md) | CQRS with command/query buses and domain events |
| [0003](./adr/0003-favorite-as-pass-through-not-aggregate.md) | `Favorite` as a pass-through join, not an aggregate |
| [0004](./adr/0004-trilingual-content-as-columns.md) | Trilingual content as `De`/`En`/`Fa` columns |
| [0005](./adr/0005-cookie-jwt-with-refresh-rotation.md) | Cookie-based JWT with refresh rotation |
| [0006](./adr/0006-signed-url-access-policy.md) | Signed-URL access policy for private documents _(superseded by 0008)_ |
| [0007](./adr/0007-unit-of-work-for-multi-step-writes.md) | Unit-of-work (Prisma `$transaction`) for multi-step writes |
| [0008](./adr/0008-public-signed-url-access.md) | Public signed-URL access for archive documents |

---

## How to read this

- **New to the system?** Start with `ARCHITECTURE.md` top to bottom, then skim the ADR titles.
- **Integrating a client?** Go straight to `openapi.yaml`.
- **Questioning a design?** The matching ADR records the context and consequences — read it before
  proposing a change, and add a superseding ADR rather than editing history.

> Diagrams are authored in **Mermaid** and render natively on GitHub and in most Markdown viewers.
