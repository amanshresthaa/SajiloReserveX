---
task: lint-floor-plan-warnings
timestamp_utc: 2025-11-21T20:18:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: low
flags: []
related_tickets: []
---

# Implementation Plan: Floor plan lint cleanup

## Objective

Resolve eslint warnings/errors in `src/app/app/(app)/seating/floor-plan/page.tsx` without changing runtime behavior.

## Success Criteria

- [ ] `eslint --max-warnings=0` succeeds for the file.
- [ ] Component behavior remains unchanged (floor plan rendering and interactions unaffected).

## Architecture & Components

- File: `src/app/app/(app)/seating/floor-plan/page.tsx`
- Adjust imports and local variables; refine hook dependencies; escape JSX quotes.

## Data Flow & API Contracts

- No API changes; only lint-focused code adjustments.

## UI/UX States

- No UX change expected.

## Edge Cases

- Ensure dependency addition does not cause unnecessary effect loops.
- Ensure memo dependency warning resolved by moving fallback inside the memo.

## Testing Strategy

- Targeted lint: `pnpm exec eslint src/app/app/(app)/seating/floor-plan/page.tsx --max-warnings=0`.

## Rollout

- No flags; direct merge once lint passes.

## DB Change Plan

- Not applicable.
