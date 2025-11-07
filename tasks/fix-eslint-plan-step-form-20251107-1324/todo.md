# Implementation Checklist

## Core

- [x] Capture ref instances outside of the cleanup callback so eslint sees stable references.

## Tests

- [x] Run `eslint --fix --max-warnings=0` to confirm zero warnings.

## Notes

- Assumptions: Refs point to persistent Map/Set instances, so capturing them once per effect is safe.
- Deviations: None.
