# Implementation Checklist

## Setup

- [x] Draft Supabase migrations (zone assignment, allocation FK, idempotency hash, slot upsert, holds enforcement, capacity helper).
- [x] Update `server` TypeScript modules to align with new DB logic (capacity re-check, hold renewal, DFS timeout, scoring tweaks).

## Core

- [x] Enforce single-zone per booking (`assign_tables_atomic_v2` + `bookings.assigned_zone_id`).
- [x] Unify hold conflict enforcement (DB exclusion + catch in app).
- [x] Add post-assignment capacity validation.
- [x] Harden idempotency uniqueness (table set hash).
- [x] Clamp service overruns instead of throwing.
- [x] Implement manual hold renewal path.
- [x] Adjust scarcity/lookahead scoring and telemetry (zone balance follow-up captured in docs).
- [x] Reduce advisory lock granularity and add DFS timeout instrumentation.

## UI/UX

- [x] N/A (backend-only change; verified API responses via automated coverage).

## Tests

- [x] Unit (`pnpm test`)
- [x] Integration (`pnpm test:ops`)
- [ ] E2E (critical flows) – Not executed; Playwright smoke to run once staging holds renewal path is exposed.
- [ ] Axe/Accessibility checks – Not applicable (no UI changes).

## Notes

- Assumptions: Feature flags remain available for gradual rollout; staging data allows backfill validation.
- Deviations: Zone balance penalty semantics left for a follow-up iteration per documentation.
- Testing coverage: E2E/Playwright smoke not run (requires staging auth + regenerated fixtures); schedule after deploying hold renewal endpoint.

## Batched Questions (if any)

- None yet.
