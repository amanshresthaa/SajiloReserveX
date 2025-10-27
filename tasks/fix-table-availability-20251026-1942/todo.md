# Implementation Checklist

## Setup

- [x] Capture current trigger behaviour and document root cause
- [x] Add forward-only Supabase migration for `refresh_table_status`

## Core

- [x] Update trigger logic to set `reserved` only when `window @> now()`
- [x] Preserve maintenance (`out_of_service`) and checked-in (`occupied`) handling

## Verification

- [ ] Schema/sql lint (if available) or syntax check
- [x] Document remote migration + manual QA steps in `verification.md`

## Notes

- Assumptions: Table availability gating should rely on live windows, not future allocations.
- Deviations:

## Batched Questions (if any)

- None at this time.
