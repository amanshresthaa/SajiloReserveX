# Implementation Plan: Fix manualConfirmHold contextVersion typing

## Objective

Ensure manual table assignment confirmation includes a valid `contextVersion` without forcing UI changes, and restore successful builds.

## Success Criteria

- [ ] `pnpm run build` succeeds with no TypeScript errors.
- [ ] Service methods handle missing `contextVersion` safely by fetching it.

## Architecture & Components

- Service: `src/services/ops/bookings.ts`
  - Update `ConfirmHoldInput` to make `contextVersion` optional.
  - Update `manualConfirmHold` to fetch `contextVersion` when not provided and include it in the request payload.

## Data Flow & API Contracts

Endpoint: POST `/api/staff/manual/confirm`
Request: `{ holdId, bookingId, idempotencyKey, contextVersion, requireAdjacency? }`
Response: `{ holdId, bookingId, assignments: Array<{ tableId, ... }> }`
Errors: `{ code, message }` including potential `STALE_CONTEXT`.

## UI/UX States

- No UI changes.

## Edge Cases

- Missing/empty `contextVersion` → service fetches from `/api/staff/manual/context`.
- Backend not requiring `contextVersion` → harmless extra field.

## Testing Strategy

- Build: `pnpm run build`.
- Smoke: Trigger code paths during manual assignment in dev if needed.

## Rollout

- No flags. Low risk; service-only change.
