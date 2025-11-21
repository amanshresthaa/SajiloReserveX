---
task: auto-assign-eslint-warning
timestamp_utc: 2025-11-20T20:56:00Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: low
flags: []
related_tickets: []
---

# Implementation Plan: Fix auto-assign ESLint warning

## Objective

Remove the unused `Database` type import in `server/jobs/auto-assign.ts` so ESLint passes without changing runtime behavior.

## Success Criteria

- [ ] ESLint runs cleanly for `server/jobs/auto-assign.ts` with zero warnings.
- [ ] Auto-assign job logic remains unchanged.

## Architecture & Components

- `server/jobs/auto-assign.ts`: server job for booking auto assignment; only type imports touched.

## Data Flow & API Contracts

- No changes to data flow or APIs; Supabase queries remain as-is.

## UI/UX States

- Not applicable (no UI change).

## Edge Cases

- None; lint-only adjustment.

## Testing Strategy

- Run `pnpm eslint server/jobs/auto-assign.ts` to confirm no warnings/errors.

## Rollout

- No flags or rollout steps required.

## DB Change Plan (if applicable)

- Not applicable; no DB schema changes.
