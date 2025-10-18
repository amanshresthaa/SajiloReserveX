# Implementation Plan: Fix Capacity Group Typing Error

## Objective

We will resolve the TypeScript error thrown during `pnpm run build` by correcting the inferred type for capacity merge groups in `server/capacity/tables.ts` so that the Next.js build pipeline succeeds.

## Success Criteria

- [x] `pnpm run build` completes without TypeScript errors in `server/capacity/tables.ts`.
- [ ] Existing behavior for capacity grouping remains unchanged (tests still pass without new regressions; currently blocked by Vitest route import failures).

## Architecture & Components

- `server/capacity/tables.ts`: normalize the Supabase relationship payload and use the normalized value when computing `capacitySum`.
- `server/ops/bookings.ts`: align server-returned booking types with shared `OpsTodayBooking` contract so downstream consumers stay type-safe.
- Optional: reuse an inline helper function within this module; no cross-module dependencies expected.

## Data Flow & API Contracts

Endpoint: _N/A_
Request: _N/A_
Response: _N/A_
Errors: _N/A_

## UI/UX States

- _N/A_

## Edge Cases

- Ensure groups without `capacity` still default to computing capacity from members.
- Handle unexpected array payloads gracefully (return first element; ignore rest).
- Preserve numeric conversions (strings → numbers) and null handling.

## Testing Strategy

- Run `pnpm run build` to ensure type check passes.
- Execute any existing unit tests targeting capacity logic if available (e.g., `pnpm test -- tests/server/capacity/...`).

## Rollout

- No flags; change lands with next deploy.
