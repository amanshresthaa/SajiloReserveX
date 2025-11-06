# Implementation Checklist

## Setup

- [x] Update test helper invocations to remove `any` casts.

## Core

- [x] Ensure mocked Supabase client fallback remains in place via `getServiceSupabaseClient`.

## UI/UX

- Not applicable.

## Tests

- [x] Run `pnpm eslint tests/server/jobs/booking-side-effects.test.ts --max-warnings=0`.
- [x] Run `pnpm vitest tests/server/jobs/booking-side-effects.test.ts`.

## Notes

- Assumptions: The mocked `getServiceSupabaseClient` continues to return a harmless stub.
- Deviations: None yet.

## Batched Questions (if any)

- None.
