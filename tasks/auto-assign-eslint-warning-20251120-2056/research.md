---
task: auto-assign-eslint-warning
timestamp_utc: 2025-11-20T20:56:00Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: low
flags: []
related_tickets: []
---

# Research: Fix auto-assign ESLint warning

## Requirements

- Functional: resolve ESLint pre-commit failure caused by unused `Database` type in `server/jobs/auto-assign.ts` without altering runtime behavior.
- Non-functional: keep auto-assign job behavior unchanged; no user-facing changes.

## Existing Patterns & Reuse

- File already imports `Tables` type for Supabase rows; only `Database` is unused. Remove unused import to align with existing type usage.

## External Resources

- None needed; change is lint-only.

## Constraints & Risks

- Avoid modifying business logic in auto-assign flow; change should be limited to removing unused import to satisfy lint.

## Open Questions (owner, due)

- None identified.

## Recommended Direction (with rationale)

- Drop the unused `Database` import from `server/jobs/auto-assign.ts` to clear the lint warning while leaving behavior intact.
