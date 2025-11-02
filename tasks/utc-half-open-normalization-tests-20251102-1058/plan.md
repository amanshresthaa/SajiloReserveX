# Implementation Plan: UTC/Half‑Open Normalization + Unit Tests (E7-S1)

## Objective

Ensure manual paths adhere to `[start, end)` UTC windows; add tests for touching windows and DST.

## Success Criteria

- [ ] Manual paths verified using UTC + half‑open.
- [ ] New unit tests green for touching windows and DST.

## Architecture & Components

- Audit/patch: `server/capacity/tables.ts` manual paths.
- Tests: add cases in `tests/server/capacity/*` for `windowsOverlap` and window utils.
