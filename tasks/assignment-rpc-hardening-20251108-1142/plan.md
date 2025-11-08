# Implementation Plan: Assignment RPC Hardening

## Objective

Eliminate duplicate assignment events, strengthen tenant/policy safety nets, and unify drift handling while keeping allocator RPC flows authoritative and observable.

## Success Criteria

- [x] Manual + automated assignment paths emit exactly one `capacity.assignment.sync` per operation.
- [x] Table assignment members always reflect real DB rows or explicit empty IDs after bounded retries; logs surface any lagging tables.
- [x] Policy/adjacency drift errors flow through a dedicated `PolicyDriftError` type and propagate `kind` metadata to telemetry/outbox.
- [x] RPC fallback heuristics catch schema cache/undefined-function cases without 5xx spikes.
- [x] Legacy availability checks bound their scans to overlapping windows.

## Architecture & Components

- `server/capacity/table-assignment/types.ts`: define `PolicyDriftError`, `PolicyDriftKind`, and `PolicyDriftDetails` so assignment + quote layers share a typed error channel.
- `server/capacity/table-assignment/assignment.ts`:
  - Enhance `synchronizeAssignments` with bounded re-fetching (≤2 attempts, 15 ms delay) and warning logs before returning empty IDs.
  - Remove redundant outbox enqueue in `assignTableToBooking` and add restaurant/tenant mismatch validation.
  - Wrap policy snapshot, adjacency snapshot, and RPC-surfaced `POLICY_CHANGED` errors in `PolicyDriftError`; enrich retry telemetry/outbox notifications with `kind`.
  - Broaden `isSchemaCacheMissError` to include Postgres codes (`42883`, `42P01`) and text heuristics.
- `server/capacity/table-assignment/availability.ts`: add `.lt/.gt` filters to `legacyTableAvailabilityCheck`.

## Data Flow & Contracts

- No API shape changes; `TableAssignmentMember.assignmentId` now documents empty-string fallback semantics so callers can re-read when necessary.
- Drift notifications/outbox payload adds `kind` while keeping previous fields, making downstream processing backward-compatible.

## Testing Strategy

- Rely on eslint + existing Vitest suites (future work: add dedicated tests for refresh + drift). Confirm lint passes post-change as required by AGENTS.
- Manual reasoning plus log review ensures new warning paths hit spec expectations.

## Rollout

- Changes are backwards compatible and guarded by existing allocator flags. Monitor logs for `[capacity.assignments] assignment rows missing` + `policy_drift.*` events after deploy.
