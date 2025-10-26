# Implementation Checklist

## Setup

- [x] Identify API + client modules involved in manual holds (`route.ts`, booking dialog, booking service).

## Core

- [x] Update seat selection flow to degrade gracefully on validation failures.
- [x] Adjust backend validation response to expose structured details.

## UI/UX

- [x] Ensure multi-select feedback appears inline without disruptive toasts.

## Tests

- [x] Unit
- [ ] Integration
- [ ] E2E (critical flows)
- [ ] Axe/Accessibility checks

## Notes

- Assumptions: Manual QA via DevTools MCP will be run once authentication/session available.
- Deviations: Full ops Vitest suite requires env secrets; targeted helper test authored but broader suite fails without configuration.

## Batched Questions (if any)

- ...
