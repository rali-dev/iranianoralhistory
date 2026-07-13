# 4. Trilingual content as `De` / `En` / `Fa` columns

- Status: Accepted
- Date: 2026-07-13
- Deciders: Engineering

## Context

Editorial content — video titles and descriptions, collection names and descriptions — must exist
in exactly three languages: German, English, and Farsi. The set of languages is **fixed and small**,
every language is curated by hand, and the frontend almost always needs all three (the language
switcher toggles instantly, and RTL Farsi sits beside LTR content). Two shapes were considered:

1. A generic **translation table** — `(entityId, field, locale, value)` — the classic
   "unlimited languages" design.
2. **Per-language columns** — `titleDe`, `titleEn`, `titleFa`, `descDe`, … on the owning row.

## Decision

Store trilingual content as **fixed per-language columns** (`*De` / `*En` / `*Fa`) directly on the
owning model (`Video`, `Collection`).

- DTOs mirror the shape as a nested trilingual object `{ de, en, fa }` (`VideoTranslationDto`),
  validated with `@ValidateNested()` + `@Type()`; the "all optional" variant supports partial
  `PATCH` updates.
- The three languages are a modelled fact of the archive, not user-configurable data.

## Consequences

**Positive**
- Reads are a single row with no join or pivot — the common "give me the whole video in all
  languages" query is trivial and fast.
- The schema makes the requirement legible: a video *has* a German, English, and Farsi title.
- The type system and the validation pipe enforce that all three are present on create.

**Negative / trade-offs**
- Adding a fourth language is a schema migration and a DTO change, not a data insert. This is
  accepted: the language set is a product decision, expected to stay at three.
- Content columns are wide; sparse optional descriptions store three nullable columns instead of
  rows-when-present. Negligible at this scale.

**Neutral**
- The editorial workflow is curation-first (a human writes each language deliberately), which the
  column model fits better than a sparse, machine-translation-oriented translation table.
