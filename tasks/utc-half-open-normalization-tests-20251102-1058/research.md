# Research: UTC/Half‑Open Normalization + Unit Tests (E7-S1)

## Requirements

- Functional:
  - Ensure all manual paths use `[start, end)` in UTC.
  - Add unit tests for touching windows and DST boundaries.
- Non‑functional:
  - Clear semantics across app/server/DB.

## Existing Patterns & Reuse

- `server/capacity/tables.ts#windowsOverlap` implements half‑open `[start, end)` with UTC normalization.
- DB uses `tstzrange(start_at, end_at, '[)')` consistently in migrations.
- Manual flows compute windows via `computeBookingWindowWithFallback` and `toIsoUtc` helpers.

## Recommended Direction

- Audit manual paths to ensure they all use UTC+half‑open semantics.
- Add unit tests for `windowsOverlap` with touching windows and DST transitions.
