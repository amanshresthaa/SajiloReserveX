# Implementation Checklist

## Setup

- [x] Confirm hydration warning via provided console trace (Plan step hydration mismatch).

## Core Changes

- [x] Add `hasHydrated` flag to `Calendar24Field`.
- [x] Gate `timeStepSeconds`, `list`/`datalist`, and fallback message on hydration status.

## Verification

- [x] Run `pnpm lint`.
- [ ] Manual QA via Chrome DevTools MCP (load booking flow, ensure no hydration errors, suggestions still work).
