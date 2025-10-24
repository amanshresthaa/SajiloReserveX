# Implementation Checklist

## Setup

- [x] Create endpoint skeleton and helper
- [x] Add client service for closed-day prefetch

## Core

- [x] Implement closed-day computation (weekly + overrides)
- [x] Wire API route to helper and validate queries
- [x] Update picker to prefetch and merge closed days

## UI/UX

- [x] Ensure disabled days render immediately
- [x] Preserve existing slot loading behavior

## Tests

- [x] Manual verification steps prepared

## Notes

- Assumptions: Instant requirement applies to “closed” days only; “no-slots” still requires schedule/slots fetch.
- Deviations: None.
