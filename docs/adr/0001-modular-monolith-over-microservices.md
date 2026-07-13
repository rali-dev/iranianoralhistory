# 1. Modular monolith over microservices

- Status: Accepted
- Date: 2026-07-13
- Deciders: Engineering

## Context

Iranian Oral History is a curated archive maintained by a small team and served to a modest,
read-heavy audience. The domain has clear seams — Identity, Video, Collection, Favorite — that
invite a distributed design, but the operational reality does not: one team, one release cadence,
one database, and no independent-scaling pressure. We want the *boundaries* of microservices
without their *distribution tax* (network hops, partial failure, eventual consistency, per-service
CI/CD and observability).

## Decision

Build a **modular monolith** on Nx: a single deployable NestJS backend composed of independent Nx
libraries, one set per bounded context, each split into the four Clean-Architecture layers
(`domain`, `application`, `infrastructure`, `adapters`).

Boundaries are enforced statically rather than by process isolation:

- `@nx/enforce-module-boundaries` fails the build on illegal imports, keyed on `type:*` and
  `platform:*` scope tags.
- Contexts reference each other only by **id**, through the `shared-contracts` kernel — never by
  reaching into another context's tables or internals.
- The dependency rule points inward: `application` may not import `infrastructure`.

## Consequences

**Positive**
- One build, one deploy, one transactional database — trivial local dev and atomic cross-table writes.
- Refactoring across contexts is a compiler-checked operation, not a coordinated multi-repo release.
- The seams are real and lint-enforced, so extraction to a separate service later is mechanical
  should load ever justify it.

**Negative / trade-offs**
- No independent scaling or independent deploy per context.
- Discipline is a lint rule, not a network boundary — a disabled rule can be bypassed, so the CI
  gate must stay mandatory.
- A single process is a single blast radius; resilience comes from replicas, not isolation.

**Neutral**
- The four-layer library layout is more upfront structure than a flat app, paid back in testability
  and boundary clarity.
