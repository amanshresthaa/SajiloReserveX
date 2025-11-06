# Implementation Plan: Fix Booking Side-Effects ESLint Warnings

## Objective

Ensure the booking side-effects tests satisfy the zero-warning lint policy by eliminating `any` casts while preserving existing behavior and coverage.

## Success Criteria

- [ ] `eslint tests/server/jobs/booking-side-effects.test.ts` runs cleanly with `--max-warnings=0`.
- [ ] Vitest suite for the affected file still passes (`pnpm vitest tests/server/jobs/booking-side-effects.test.ts`).

## Architecture & Components

- `tests/server/jobs/booking-side-effects.test.ts`: update the invocations of the side-effect helpers to stop passing `{} as any` where an optional Supabase-like argument is accepted.
  State: pure test module without shared state; no URL state involved.

## Data Flow & API Contracts

- Rely on the mocked `getServiceSupabaseClient` to provide a stub client for analytics calls instead of injecting a dummy object. No external API contracts change.

## UI/UX States

- Not applicable (test-only change).

## Edge Cases

- Ensure the tests never attempt to hit a real Supabase client when the optional argument is omitted.
- Verify that queue-enabled paths remain covered and still assert the right behaviors.

## Testing Strategy

- Unit: run lint and the specific Vitest file.
- Integration: not required.
- E2E: not required.
- Accessibility: not applicable.

## Rollout

- No feature flag; commit via standard review flow.
- Monitoring: rely on CI lint/test stages.
- Kill-switch: revert commit if needed.
