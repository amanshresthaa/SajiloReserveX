# Implementation Checklist

## Setup

- [x] Import `SelectGroup` where needed for the zone select field.

## Core

- [x] Wrap the disabled-state message in a `SelectGroup` so `SelectLabel` has the required context.
- [x] Ensure the populated-state branch keeps rendering the `SelectItem` options unchanged.

## UI/UX

- [ ] Verify the zone select renders without runtime errors when zones are missing and when they exist.

## Tests

- [ ] Unit
- [ ] Integration
- [ ] E2E
- [ ] Axe/Accessibility checks

## Notes

- Assumptions:
- Deviations:
- Ran `pnpm tsc --noEmit --pretty false` for a quick type check.

## Batched Questions (if any)

- None
