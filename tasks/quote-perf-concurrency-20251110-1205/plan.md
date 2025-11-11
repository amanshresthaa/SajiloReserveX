# Implementation Plan

1. After loading the booking, start asynchronous fetches for restaurant timezone, restaurant tables, strategic config, and demand multiplier without awaiting immediately.
2. Once the booking window is computed, await the tables, then kick off adjacency loading.
3. When time pruning or lookahead is enabled, fetch context bookings and active holds concurrently via `Promise.all`, keeping the existing error logging.
4. Await the strategic config promise before reading combination flags; await the demand multiplier promise (with graceful null fallback) before scoring.
5. Run `pnpm lint`.
