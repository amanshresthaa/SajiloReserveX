# Implementation Checklist

## Setup

- [x] Audit codebase for `selectorYieldManagement` references and document removals.

## Core

- [x] Remove yield feature flag from env schema/parsing and feature flag helpers.
- [x] Always hydrate demand multipliers & scarcity scores in selector and update default weights.
- [x] Adjust telemetry payload/types to drop `yieldManagementEnabled`.
- [x] Update documentation to reflect mandatory yield scoring.

## Tests

- [x] Unit
- [x] Integration
- [ ] E2E (critical flows)
- [ ] Axe/Accessibility checks

## Notes

- Assumptions:
- Deviations:
  - E2E/A11y not applicable (service-layer change); recorded automated ops tests instead.

## Batched Questions (if any)

-
