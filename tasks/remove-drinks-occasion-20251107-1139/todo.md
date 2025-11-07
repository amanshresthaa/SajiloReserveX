# Implementation Checklist

## Setup

- [x] Run Supabase remote queries to capture current `booking_occasions` data (found `drinks` active).
- [x] Gather `restaurant_service_periods` rows referencing `drinks` (none across restaurants).

## Core

- [x] Update `booking_occasions` to deactivate `drinks` if present.
- [x] Update or remove `restaurant_service_periods` rows that still reference `drinks` (none required after verification).

## Verification

- [x] Re-run the diagnostic queries to confirm no `drinks` rows remain active.
- [ ] (Optional) Hit schedule endpoint to ensure payload excludes `drinks` (not run; API client unavailable in this session).

## Notes

- Assumptions: No restaurant should expose `drinks` occasion going forward.
- Deviations: Schedule endpoint smoke test deferred; data-level verification only.
