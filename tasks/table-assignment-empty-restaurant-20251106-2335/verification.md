# Verification Report

## Manual QA — Chrome DevTools (MCP)

- Not applicable (server-side allocator + Supabase migration change only).

## Test Outcomes

- [x] `pnpm lint`
  - Passed; no lint violations introduced by the allocator changes.
- [x] Custom TSX harness invoking `quoteTablesForBooking` + `atomicConfirmAndTransition`
  - Booking `68dc2c89-c0e6-4d0d-89b4-2aa8318d2610` confirmed via the manual harness after applying migrations `20251106235900_fix_confirm_hold_transition_alias.sql` and `20251107001500_fix_confirm_hold_transition_alias_v2.sql`.
- [x] Background auto-assign job replay (via `autoAssignAndConfirmIfPossible`)
  - Seeded booking `e6343aab-380f-409d-9c62-61e353b0441e` transitioned from `pending` → `confirmed`, persisted two table assignments, and emitted the confirmation email.

## Notes

- Verified that `quoteTablesForBooking` now produces holds with `metadata.policyVersion` plus `selection.snapshot` (zoneIds + adjacency hash) via the manual confirm harness logs; these fields satisfied the stricter validator.
- Both Supabase migrations (initial aliasing + v2 fix) are applied remotely; with the RPC fixed, inline and background auto-assign flows succeed end-to-end.
