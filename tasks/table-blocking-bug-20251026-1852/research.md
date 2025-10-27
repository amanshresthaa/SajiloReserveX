# Research: Table blocking for partial-day reservations

## Existing Patterns & Reuse

- Auto/Manual assignment logic lives in `server/capacity/tables.ts`; it computes per-booking block windows using the venue policy and buffers before persisting allocations.
- Table status propagation occurs in Supabase via the `refresh_table_status` trigger declared in `supabase/migrations/20251019102432_consolidated_schema.sql`.

## External Resources

- `supabase/migrations/20251019102432_consolidated_schema.sql` — documents how table statuses are derived from allocation windows.

## Constraints & Risks

- Current DB trigger sets `table_inventory.status = 'reserved'` whenever a table has any future allocation (`upper(window) > now()`), regardless of how far in the future the seating occurs.
- Front-end surfaces rely on this coarse status, so changing the trigger semantics would ripple through Ops dashboards and automations.

## Open Questions (and answers if resolved)

- Q: What logic determines table availability windows?
  A: `computeBookingWindow` in `server/capacity/tables.ts` derives the block from the booking start/end times plus service buffers; assignments store this window in `allocations.window`.
- Q: Why does the UI show the table as blocked all day once assigned?
  A: Because `refresh_table_status` upgrades the table status to `reserved` as soon as a future allocation exists, the dashboard treats it as unavailable even before the seating window begins.

## Recommended Direction (with rationale)

- Adjust `refresh_table_status` so it marks tables as `reserved` only when `now()` falls inside an allocation window; this keeps Ops UI availability accurate while allocator overlap checks continue to prevent conflicting assignments.
