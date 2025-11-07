# Implementation Checklist

## Setup

- [x] Update regex literal to remove pointless escapes.
- [x] Replace `any` generic in `DbClient` alias with the public schema type.

## Core

- [x] Ensure tests still express the intended expectation string.
- [x] Confirm the Supabase client type remains compatible with call sites.

## Tests

- [x] `pnpm exec eslint tests/server/restaurants/servicePeriods.test.ts server/restaurants/servicePeriods.ts --max-warnings=0`

## Notes

- Assumptions: The generated `Database` type includes a `'public'` schema definition.
- Deviations: None.
