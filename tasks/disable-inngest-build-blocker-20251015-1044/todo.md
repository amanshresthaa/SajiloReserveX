# Implementation Checklist

## Setup

- [x] Inspect existing Inngest route implementation
- [x] Identify current env guard usage

## Core

- [x] Update Inngest route to noop/return error when key missing
- [x] Ensure runtime import paths handle disabled state

## Tests

- [x] Update/add tests covering missing key scenario
- [x] Run `pnpm run build`

## Notes

- Assumptions:
- Deviations:
  - Inngest route and queue removed outright; side-effects now execute inline.

## Batched Questions (if any)

- None currently
