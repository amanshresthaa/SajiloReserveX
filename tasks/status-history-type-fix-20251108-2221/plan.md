# Implementation Plan: Ops Auto Assign History Status Type Fix

## Objective

We will ensure the ops auto assign loop passes correctly typed booking status history fields to Supabase so that the build succeeds and RPC calls remain type-safe.

## Success Criteria

- [ ] `pnpm run lint` (covers TypeScript) succeeds locally.
- [ ] `p_history_from` uses the Supabase `booking_status` union without `any`/casts.
- [ ] Behavior of the assignment loop remains unchanged aside from stronger typing/defaulting.

## Architecture & Components

- `scripts/ops-auto-assign-ultra-fast-loop.ts`: introduce a status normalizer that leverages Supabase enums, and update `markBookingConfirmed` + caller to use the normalized type.
  State: helper will return a typed status with a `"pending"` fallback to cover null/unknown states.

## Data Flow & API Contracts

- RPC `apply_booking_state_transition` already requires `p_history_from: booking_status`; we will ensure our arguments meet this contract by normalizing before invocation.

## UI/UX States

- Not applicable (script-only change).

## Edge Cases

- Unexpected status strings from historical data should degrade gracefully to `"pending"` instead of throwing type errors.

## Testing Strategy

- Rely on TypeScript/linting to confirm typing issues are resolved (`pnpm run lint`).
- Since behavior is unchanged and script has no direct unit tests, compilation acts as regression coverage.

## Rollout

- No feature flags; once merged, the build should pass everywhere.
- No runtime rollout risk because change is a local helper plus type narrowing.
