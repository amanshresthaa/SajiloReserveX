# Implementation Plan: Manual Table Assignment Documentation

## Objective

We will document the manual table assignment architecture so ops engineers understand components, data flow, rules, integrations, and state.

## Success Criteria

- [ ] Low-level architecture doc with code references
- [ ] Flowcharts (overview + sub-processes) in Mermaid
- [ ] Sequence diagrams for key interactions
- [ ] ER diagram of table-related entities
- [ ] SDLC artifacts created in task folder

## Architecture & Components

- UI (ops dashboard): dialog + manual assignment components and hooks
- API routes: `/api/staff/manual/*`, `/api/ops/bookings/[id]/tables*`
- Capacity engine: validation, hold create, confirm via orchestrator
- Supabase RPCs and tables

## Data Flow & API Contracts

- Manual Validate: POST `/api/staff/manual/validate` { bookingId, tableIds, requireAdjacency?, excludeHoldId? } → validation result
- Manual Hold: POST `/api/staff/manual/hold` { bookingId, tableIds, holdTtlSeconds?, requireAdjacency?, excludeHoldId? } → hold + validation
- Manual Confirm: POST `/api/staff/manual/confirm` { holdId, bookingId, idempotencyKey, requireAdjacency? } → assignments
- Context: GET `/api/staff/manual/context?bookingId=...` → tables+holds+conflicts window
- Assign: POST `/api/ops/bookings/{id}/tables` { tableId }
- Unassign: DELETE `/api/ops/bookings/{id}/tables/{tableId}`

## UI/UX States

- Loading context, selection pending, validation checks, hold countdown, confirm enabled when no blocking errors.

## Edge Cases

- Hold conflicts, cross-zone selection, adjacency not met, capacity shortfall, stale holds.

## Testing Strategy

- Manual QA using seeded data; verify API responses and error codes.

## Rollout

- Feature flags gate behavior (holds, adjacency, allocator v2). Ensure flags set in target env.
