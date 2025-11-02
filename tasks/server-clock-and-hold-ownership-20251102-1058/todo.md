# Implementation Checklist

## Core

- [ ] Return `serverNow` from `createManualHold` and `getManualAssignmentContext`.
- [ ] Enforce authorization in `extendTableHold` (creator or elevated).

## Tests

- [ ] Unit tests for authorization logic.
- [ ] Manual QA: countdown stable.
