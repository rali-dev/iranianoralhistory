# 2. CQRS with command/query buses and domain events

- Status: Accepted
- Date: 2026-07-13
- Deciders: Engineering

## Context

Controllers tend to accrete business logic, and use-cases tend to hide inside services that both
read and write. We want a delivery-agnostic application layer where each use-case is an explicit,
testable unit, and where side-effects (welcome flows, cache priming, future projections) can be
added without touching the write path.

## Decision

Adopt **CQRS** with `@nestjs/cqrs` and **domain events** with `@nestjs/event-emitter`.

- Controllers (adapters layer) contain no business logic. They map an HTTP request to a **Command**
  (writes) or **Query** (reads) and dispatch it on the `CommandBus` / `QueryBus`.
- Handlers live in the **application** layer; write handlers extend a shared `BaseCommandHandler`.
- Handlers depend on **domain port interfaces** (injected by DI token), never on infrastructure.
- Meaningful state changes publish **domain events** (`UserRegisteredEvent`, `VideoCreatedEvent`,
  …). Subscribers react independently, decoupled from the command that emitted the event.

## Consequences

**Positive**
- Every use-case is a named, in-isolation-testable object; the HTTP layer stays thin.
- Read and write models can diverge without entangling each other.
- New reactions to an event attach as subscribers — the write path is not edited to add a side-effect.

**Negative / trade-offs**
- More files and indirection per use-case than a single service method — overkill for truly trivial
  CRUD, accepted for consistency.
- In-process `event-emitter` events are fire-and-forget and not durable; anything requiring
  guaranteed delivery must use an outbox or a transaction (see ADR-0007), not an event alone.

**Neutral**
- Command and query buses are separate concerns from persistence; the pattern says nothing about
  the database, which remains a single Postgres instance.
