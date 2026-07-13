# 3. `Favorite` as a pass-through join, not an aggregate

- Status: Accepted
- Date: 2026-07-13
- Deciders: Engineering

## Context

A signed-in user can mark a video as a favourite. The other three contexts (Identity, Video,
Collection) are modelled as rich aggregates with Value Objects and invariants. It is tempting to
mirror that here and build a `Favorite` aggregate — but a favourite carries **no business rules**:
it is the mere existence of a `(userId, videoId)` pair. There is no state to keep consistent, no
invariant to protect, no lifecycle beyond "exists / does not exist".

Forcing an aggregate onto data with no invariants adds ceremony (entity, repository semantics,
domain events) that protects nothing and obscures how thin the concept really is.

## Decision

Model **Favorite as a deliberate pass-through**: a pure many-to-many join table `UserFavorite`
keyed on `(userId, videoId)`. It is explicitly **not** an aggregate.

- Operations are set semantics: add (idempotent insert) and remove (delete). "List my favourites"
  returns the set of `videoId`s.
- The `FAVORITE_REPOSITORY` port exposes just those operations; the handlers hold no branching logic.
- Referential integrity is the database's job: both foreign keys `onDelete: Cascade`, so deleting a
  user or a video removes the corresponding favourites automatically.

## Consequences

**Positive**
- The code matches the domain: a join is modelled as a join, honestly and minimally.
- No invariant means no place for invariant bugs; correctness reduces to a composite primary key.
- Cascades keep the table clean with zero application-level bookkeeping.

**Negative / trade-offs**
- If a favourite ever grows real behaviour (ordering, tags, notes, "favourited at" surfaced as
  domain state), this decision must be revisited and the concept promoted to an aggregate.
- The asymmetry with the other contexts must be documented — which is the point of this ADR — so it
  reads as intentional, not as an omission.

**Neutral**
- The row still stores `createdAt`; it is metadata, not a domain invariant, and does not change the
  pass-through classification.
