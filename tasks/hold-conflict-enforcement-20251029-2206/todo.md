# Implementation Checklist

## Setup

- [x] Create task folder and SDLC artifacts.

## Core

- [x] Update `types/supabase.ts` to add the `set_hold_conflict_enforcement` RPC definition.
- [x] Add the new `table_hold_windows` table definition to `types/supabase.ts`.
- [x] Expose the `feature_flag_overrides` table in `types/supabase.ts`.

## UI/UX

- Not applicable.

## Tests

- [x] Run `pnpm run build` to ensure the TypeScript compiler succeeds.

## Notes

- Assumptions: Manual edit to generated types is acceptable until regenerated from Supabase.
- Deviations: None.

## Batched Questions (if any)

- None.
