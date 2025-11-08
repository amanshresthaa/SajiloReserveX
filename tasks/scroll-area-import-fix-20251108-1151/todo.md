# Implementation Checklist

## Setup

- [x] Add Shadcn scroll area component under `components/ui/`.

## Core

- [x] Ensure component exports align with consumer expectations.

## UI/UX

- [ ] Confirm styles match the reference implementation.

## Tests

- [x] Run `pnpm run lint`.
- [x] Run `pnpm run build`.

## Notes

- Assumptions: `@radix-ui/react-scroll-area` is already installed via previous Shadcn components.
- Deviations: Fixed a lingering type import in `server/ops/table-timeline.ts` uncovered by the build.
