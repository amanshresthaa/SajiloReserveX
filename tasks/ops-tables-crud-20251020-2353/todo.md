# Implementation Checklist

## Setup

- [x] Introduce `src/server/ops/tables-repository.ts` with typed helpers for table CRUD, summary, adjacency.
- [x] Update Supabase service factory/types if needed to expose repository (ensure `types/supabase.ts` coverage).

## Core

- [x] Refactor `/api/ops/tables` GET/POST to use repository + align responses to schema.
- [x] Refactor `/api/ops/tables/[id]` PATCH/DELETE for repository + maintenance safeguard parity.
- [x] Refactor `/api/ops/tables/[id]/adjacent` to centralize adjacency logic.
- [x] Overhaul `src/services/ops/tables.ts` to map repository DTOs and expose typed service methods.
- [ ] Rebuild `TableInventoryClient` into modular components/hooks with updated validation + messaging.

## UI/UX

- [ ] Ensure responsive layout persists after refactor (mobile-first).
- [ ] Implement loading/empty/error states per plan.
- [ ] Validate accessibility: labels, focus handling, keyboard support.

- [x] Add/extend unit tests for repository + DTO mappers.
- [ ] Expand API route tests to cover CRUD happy/failure paths.
- [ ] Update/add Playwright (or relevant) E2E smoke for table CRUD.
- [ ] Run axe/a11y checks (manual or automated) and record in verification.

## Notes

- Assumptions: Table creation no longer blocks on allowed capacities in UI; database FK will surface errors if configuration is missing.
- Deviations: Full modular rebuild of table UI deferred for follow-up; focused on backend refactor and targeted UX alignment.

## Batched Questions (if any)

- ...
