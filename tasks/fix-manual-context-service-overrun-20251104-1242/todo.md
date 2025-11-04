# Implementation Checklist

## Setup

- [x] Create task docs (research, plan)

## Core

- [x] Catch `ServiceOverrunError` in `getManualAssignmentContext` and translate to `ManualSelectionInputError(422, SERVICE_OVERRUN)`

## Tests

- [x] Typecheck/build locally
- [ ] Manual QA via DevTools (UI path to manual context)

## Notes

- Assumptions: UI will handle 422 with code `SERVICE_OVERRUN`.
- Deviations: None
