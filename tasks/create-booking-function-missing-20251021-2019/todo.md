# Implementation Checklist

## Setup

- [x] Review existing Supabase RPC definitions related to bookings
- [x] Confirm API route expectations for booking creation

## Core

- [x] Implement or update server logic to call the correct Supabase function
- [x] Ensure error handling surfaces actionable messages

## UI/UX

- [ ] Confirm reservation wizard displays success and error states as expected

## Tests

- [x] Add or update automated coverage exercising a successful booking creation path
- [ ] Document any manual QA performed

## Notes

- Assumptions:
  - Manual UI QA deferred for now because the change only alters backend booking creation; no UI states were touched.
- Deviations:
  - Rather than restoring the removed Supabase RPC, the capacity transaction now falls back to direct inserts when the RPC is missing.

## Batched Questions (if any)

- ...
