# Implementation Checklist

## Setup

- [x] Create task folder and artifacts

## Core

- [x] Update Ops hooks to import `fetchJson` from the correct path
- [x] Search for other references to `@/lib/http/client`
- [x] Resolve lucide icon type error surfaced during build

## UI/UX

- [x] Not applicable (no UI changes)

## Tests

- [x] `pnpm run build`

## Notes

- Assumptions: Only the Ops hooks use the outdated path.
- Deviations: Build uncovered a lucide icon type mismatch; added to scope to unblock build.

## Batched Questions (if any)

- None at this time.
