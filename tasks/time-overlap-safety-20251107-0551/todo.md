# Implementation Checklist

## Setup

- [ ] Confirm Supabase target env + gather DB stats (table sizes, null counts for `start_at/end_at`). _(Blocked: no `$SUPABASE_DB_URL`/credentials in current shell — needs Ops to supply staging/production URLs before running scripts.)_
- [ ] Align stakeholders on remediation order + cutoff for constraint validation.

## Core

- [x] Create structural migration (range columns, check constraints, payload checksum column, composite FK adjustments if needed).
- [x] Create concurrent index/exclusion constraint migration (GiST indexes, `bta_no_overlap`, `thw_no_overlap`, hot-path indexes, `thm_unique` if missing).
- [x] Add precheck/backfill scripts + instructions (detect null windows, overlaps, inconsistent hold times).
- [x] Implement new RPC `confirm_hold_assignment_tx`, update Supabase grants, and expose through `server/capacity/table-assignment` client.
- [x] Update `assignment.ts`, `quote.ts`, `availability.ts`, `manual.ts`, `booking-window.ts` for business rule fixes (max party flag, merged-set, zone enforcement, adjacency immutability, lunch overrun config).
- [x] Wire TypeScript types (Zod, Supabase generated types) for new columns/range fields.

## UI/UX

- [ ] N/A (backend-focused) – still ensure manual assignment UX unaffected via verification.

## Tests

- [x] Expand Vitest/Jest suites for lookahead, filter, manual validator, lunch overrun, adjacency immutability.
- [ ] Add SQL/pgTAP or Node integration tests for exclusion constraints + RPC transactional behavior. _(still pending; currently covered by Vitest only — consider pgTAP harness once Supabase remote window available.)_
- [x] Run `pnpm lint`, `pnpm test`, targeted suite(s). _(latest run documented 2025-11-07 — rerun after remote rollout.)_

## Notes

- Assumptions:
  - Production DB already running Postgres 15 (supports `CREATE INDEX CONCURRENTLY IF NOT EXISTS`).
  - Unique constraint on `table_hold_members` currently enforced; migration must avoid duplication if possible.
- Deviations:
  - Remote data quality/remediation pending: overlap + null-window scans blocked on DB credentials; scripts/check_assignment_overlaps.sql + scripts/validate_overlap_constraints.sql prepared for when access is granted.

## Batched Questions (if any)

- Pending confirmation on how to handle `table_hold_windows_no_overlap` replacement (drop vs rename).
