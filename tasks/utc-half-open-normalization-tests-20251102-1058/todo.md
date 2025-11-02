# Implementation Checklist

## Core

- [ ] Verify all manual paths use `toIsoUtc` and half‑open ranges.

## Tests

- [ ] Add `windowsOverlap` tests for touching windows (end == start).
- [ ] Add DST boundary tests (spring forward/fall back).
