# Implementation Checklist

## Setup

- [ ] Add startup enforcement in `server/supabase.ts` (one‑time RPC + self‑check + sticky state).
- [ ] Wire telemetry/log when enforcement fails (fail fast switch).

## Core

- [ ] Pre‑check holds in direct assign route `src/app/api/ops/bookings/[id]/tables/route.ts` using `findHoldConflicts`.
- [ ] Keep DB as source of truth (RPC overlap and GiST exclusion backstop).

## UI/UX

- [ ] Return canonical error `HOLD_CONFLICT` with details.

## Tests

- [ ] Unit test: startup enforcement path (mock rpc, fallback behavior).
- [ ] Integration: direct assign blocked by overlapping hold.

## Notes

- Assumptions: Restaurant acts as tenant; conflict against same booking’s active hold is non‑blocking (per current manual flow).
- Deviations: None yet.

## Batched Questions

- Should we block if the hold belongs to the same booking? (Default: no)
