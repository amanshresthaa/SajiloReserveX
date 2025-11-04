# Implementation Checklist

## Setup

- [x] Create task artifacts

## Core

- [ ] Update `normalizeWindow` semantics + warn on `end <= start`
- [ ] Simplify `windowsOverlap` DST handling (remove fragile heuristics)

## Tests

- [ ] Add tests for `normalizeWindow` edge cases
- [ ] Add tests for `windowsOverlap` around DST boundaries

## Notes

- Assumptions:
  - Cross-midnight demand windows are modeled with two separate rules.
- Deviations:
  - Removing DST boundary-touch overlap rule to prefer simple half-open semantics.

## Batched Questions (if any)

--
