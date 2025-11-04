# Implementation Plan: Auto-Assignment 100% Failure Rate

## Objective

We will instrument and bisect the allocator to restore a high success rate for realistic bookings on 2025-11-10 and reduce per-booking processing time to under 1s, identifying and fixing the root cause (likely time pruning or lookahead).

## Success Criteria

- [ ] Success rate ≥ 80% on 100 smart bookings (Monday)
- [ ] Avg processing time < 1,000ms per booking
- [ ] Clear diagnostics for rejections (counts, reasons)
- [ ] No regressions for service-period overrun guard

## Architecture & Components

- server/capacity/tables.ts: add optional debug logs in `filterAvailableTables` and after time-pruning; guard by env `CAPACITY_DEBUG=1`.
- server/capacity/selector.ts: log plan counts, single vs combination attempts, fallback reason; guard by env.
- server/feature-flags.ts: honor env to quickly disable time pruning and lookahead.
- scripts/test-single-assignment.ts: isolate a known simple booking (party 2 @ 12:00) and print quote diagnostics.

State: debug flags via process.env | URL state: N/A

## Data Flow & API Contracts

Endpoint: internal server functions
Request: bookingId, env flags
Response: quote result with diagnostics (holds, alternates, reason)
Errors: thrown or returned reason string (e.g., "No suitable tables available")

## UI/UX States

N/A (back-end tooling). Scripts will print concise diagnostics to console.

## Edge Cases

- No service periods (should produce service overrun or rejection)
- Zero tables / out_of_service tables
- Missing scarcity data (fallback path)
- Large parties requiring combinations

## Testing Strategy

- Unit: lightweight checks around time filtering (if feasible)
- Integration: run `scripts/test-single-assignment.ts` and batch `scripts/ops-auto-assign-ultra-fast.ts`
- E2E: not required
- Accessibility: not applicable (no UI)

## Rollout

- Feature flag: env toggles only (debug only, not permanent)
- Exposure: local/dev only; no prod toggles committed
- Monitoring: console diagnostics + reports in `reports/`
- Kill‑switch: revert debug logs; set flags to defaults
