# Implementation Checklist

## Setup

- [x] Confirm absence of existing Switch component and locate Shadcn source.

## Core

- [x] Add missing Switch component implementation via Shadcn CLI.
- [x] Ensure TableInventoryClient can continue importing `@/components/ui/switch` without code changes.

## UI/UX

- [ ] Verify responsive layout remains intact after change.

## Tests

- [ ] Run `pnpm run build` to confirm success (blocked by missing `@types/pg`).

## Notes

- Assumptions:
- Deviations:
  - Build currently fails on unrelated missing type declaration for `pg`; see `scripts/stress-check-table-blocking.ts`.

## Batched Questions (if any)

- None yet.
