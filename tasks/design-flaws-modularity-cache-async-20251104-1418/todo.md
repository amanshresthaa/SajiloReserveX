# Implementation Checklist

## Setup

- [x] Create task folder and artifacts

## Core

- [ ] Make fallback config load async (no `readFileSync`)
- [ ] Add Upstash-backed distributed invalidation (optional)
- [ ] Extract `windowsOverlap` helpers into `server/capacity/time-windows.ts`

## Tests

- [ ] Typecheck and run focused tests for windowsOverlap and demand profiles

## Notes

- Assumptions: Upstash env vars optional; if absent, behavior is unchanged.
- Deviations: Keeping cache API synchronous; distributed invalidation is eventual.
