# Implementation Plan

1. Add `release_hold_and_emit` SQL function (stored in Supabase migrations) that:
   - Locks the hold row
   - Deletes members + hold rows
   - Emits an observability event with key metadata
   - Returns whether a row was deleted
2. Update `releaseTableHold` in `server/capacity/holds.ts` to call the RPC first, falling back to the existing delete logic if the RPC fails or isn’t available.
3. Log any RPC failures for visibility.
4. Run `pnpm lint`.
