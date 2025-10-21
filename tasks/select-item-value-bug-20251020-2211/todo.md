# Implementation Checklist

## Setup

- [ ] Document current select usage and confirm empty-state repro.

## Core

- [ ] Update zone select default value and disabled state when `zoneOptions` is empty.
- [ ] Replace empty `<SelectItem>` with non-interactive message inside dropdown.
- [ ] Add helper text nudging users to create zones.

## UI/UX

- [ ] Verify disabled styling aligns with design tokens.

## Tests

- [ ] Manually smoke `/ops/tables` with and without zones (record in verification.md).

## Notes

- Assumptions: Ops may access tables before zones exist.
- Deviations: None.

## Batched Questions (if any)

- None.
