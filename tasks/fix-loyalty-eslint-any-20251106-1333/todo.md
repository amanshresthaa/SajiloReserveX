# Implementation Checklist

## Setup

- [x] Update Supabase client type alias in `server/loyalty.ts`.

## Core

- [x] Ensure the new alias matches existing client usage patterns.

## Tests

- [x] Run `pnpm eslint server/loyalty.ts --max-warnings=0`.
- [x] Run `pnpm vitest tests/server/capacity/manualConfirm.test.ts`.

## Notes

- Assumptions: Supabase schema remains `"public"` for this context.
- Deviations: None yet.

## Batched Questions

- None.
