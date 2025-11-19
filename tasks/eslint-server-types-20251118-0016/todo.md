---
task: eslint-server-types
timestamp_utc: 2025-11-18T00:16:47Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: low
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [x] Review current type usage in `manual-session.ts` and `catalog.ts`.

## Core

- [x] Replace `any` Supabase client generics with `Database` types.
- [x] Introduce typed structures for session rows, patches, holds, and versions instead of `any`/`Record<string, any>`.
- [x] Remove unused variables (e.g., `updated`).

## Tests

- [x] Run eslint on affected files / repo and ensure zero warnings.

## Notes

- Assumptions: Behavior unchanged; only typing improvements.
- Deviations: None yet.
