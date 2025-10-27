# Implementation Checklist

## Setup

- [x] Confirm allocator options type definitions

## Core

- [x] Update type or usage to support adjacency requirement
- [x] Ensure allocator logic still matches expected behavior

## UI/UX

- [ ] Not applicable

## Tests

- [x] `pnpm run build`
- [x] `pnpm exec vitest run tests/server/capacity/selector.scoring.test.ts`

## Notes

- Assumptions: Adjacency remains required unless explicitly disabled via options.
- Deviations: Patched `emitRpcConflict` call to use `booking.id` so the build could progress past the next TypeScript failure.

## Batched Questions (if any)

- None currently.
