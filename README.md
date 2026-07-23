# Iranian Oral History

[![CI](https://github.com/rali-dev/iranianoralhistory/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/rali-dev/iranianoralhistory/actions/workflows/ci.yml)

**🌐 Live demo → [iranianoralhistory.vercel.app](https://iranianoralhistory.vercel.app)**

A public digital archive of oral-history **video interviews** with associated documents,
organized into curated collections and presented **trilingually** in German, English and
Farsi. Visitors can browse the catalog and open documents without an account; registered
users can mark favorites, and administrators manage the content through a protected panel.

Built as an **NX monorepo** following **Domain-Driven Design / Clean Architecture**:
an Angular single-page frontend and a NestJS backend share a single repository with
strictly enforced module boundaries.

---

## Tech stack

| Layer | Technology |
|---|---|
| **Monorepo** | Nx 22, TypeScript 5.9, Node 22 |
| **Frontend** | Angular 21 (standalone + Signals), Tailwind CSS v4 |
| **Backend** | NestJS 11, CQRS (`@nestjs/cqrs`), domain events (`@nestjs/event-emitter`) |
| **Database** | PostgreSQL via Prisma 7 (`@prisma/adapter-pg`) |
| **Auth** | Passport JWT — access + refresh tokens in `HttpOnly`, `Secure`, `SameSite=Strict` cookies; bcrypt password hashing; `@nestjs/throttler` rate limiting; Helmet |
| **Storage** | Supabase Storage (private bucket, signed URLs) |
| **Email** | Resend (password-reset flow) |
| **Testing** | Jest (unit), Supertest (backend integration), Playwright (browser E2E, Chromium + Firefox) |
| **CI** | GitHub Actions — lint · test · build via `nx affected` |
| **Hosting** | Vercel (frontend) · Render (backend) · Supabase (database + storage) |

## Architecture

The codebase is a **modular monolith** split into 31 libraries across a four-layer DDD
structure. Dependencies point inward and are enforced by ESLint tags — the application
layer, for example, can never import infrastructure.

```
scope:domain          → domain, shared                      (entities, value objects, events)
scope:application     → application, domain, shared         (CQRS command/query handlers)
scope:infrastructure  → infrastructure, domain, shared      (Prisma repositories)
scope:adapters        → adapters, application, domain, shared (controllers)
platform:backend      → backend, universal
platform:frontend     → frontend, universal
```

Key patterns:

- **CQRS** — commands and queries dispatch through `CommandBus` / `QueryBus`; handlers live in the application layer and return value objects, never HTTP concerns.
- **Domain events** — e.g. `RegisterUserHandler` emits `UserRegisteredEvent`; `@OnEvent()` listeners react in the application layer.
- **Dependency inversion** — handlers depend on repository interfaces (`IUserRepository`) injected via DI tokens; Prisma implementations are wired globally in infrastructure modules.
- **Value objects** — `Email`, `VimeoId` guard invariants inside entities.
- **Frontend state** — Angular Signals only (no NgRx); stores follow an `idle | loading | success | error` status pattern.
- **Trilingual content** — every content field carries `De` / `En` / `Fa` variants.

## Domains & features

| Domain | Feature |
|---|---|
| **Identity** | Register, login, logout, JWT refresh, password reset, role-based access (`USER` / `ADMIN`) |
| **Video** | Video catalog (Vimeo-hosted), per-video documents via Supabase signed URLs, admin CRUD |
| **Collection** | Curated collections by `PERSON` or `TOPIC` |
| **Favorite** | Per-user favorites |
| **Content pages** | Home, multi-section About, the *Ghani Boulorian* letter, day/night theming |

## Project structure

```
apps/
  frontend/         Angular SPA
  backend/          NestJS API
  frontend-e2e/     Playwright browser tests
  backend-e2e/      Supertest integration tests
libs/
  backend/<domain>/{domain,application,infrastructure,adapters}
  backend/shared/{database,storage,auth-infra,application}
  frontend/<domain>/{data-access,feature-*}
  frontend/shared/{ui,utils,i18n}
  shared/contracts  Cross-platform DTOs & interfaces
```

## Getting started

**Prerequisites:** Node.js 22, npm, and a PostgreSQL database (local or Supabase).

```sh
# 1. Install dependencies
npm install

# 2. Configure environment — create a .env in the repo root (see below)

# 3. Generate the Prisma client and apply migrations
npm run db:generate
npm run db:migrate

# 4. Run the apps (separate terminals)
npx nx serve backend      # NestJS API
npx nx serve frontend     # Angular dev server on http://localhost:4200
```

### Required environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Supabase Session Pooler in production) |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Token signing secrets (≥ 32 chars, must differ) |
| `SUPABASE_URL` / `SUPABASE_SECRET_KEY` / `SUPABASE_BUCKET` | Document storage |
| `RESEND_API_KEY` | Transactional email (password reset) |
| `CORS_ORIGINS` | Allowed frontend origins (comma-separated) |

The full production setup (Supabase → Render → Vercel, including the same-origin cookie
proxy) is documented step by step in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Testing

```sh
npx nx run-many -t test          # all unit tests (Jest)
npx nx e2e backend-e2e           # backend integration tests (Supertest, needs a DB)
npx nx e2e frontend-e2e          # browser E2E (Playwright, needs the app + a DB)
npx nx run-many -t lint          # lint every project
```

Unit tests are hermetic (mocked, no database). The integration and browser E2E suites
require a running database and environment secrets, which is why **CI runs only the
hermetic lint · test · build gate** — see below.

## CI/CD

- **Continuous Integration** — [`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs
  `nx affected` for **lint**, **test** and **build** on every push and pull request to
  `main`, rebuilding only the projects a change actually touches.
- **Continuous Deployment** — a push to `main` triggers automatic redeploys: **Vercel**
  builds and serves the frontend, **Render** builds and runs the backend
  (`autoDeployTrigger: commit`), backed by a **Supabase** PostgreSQL database and storage
  bucket.

## Useful commands

```sh
npx nx graph                     # visualize the project dependency graph
npx nx build frontend            # production frontend build
npx nx build backend             # production backend build
```
