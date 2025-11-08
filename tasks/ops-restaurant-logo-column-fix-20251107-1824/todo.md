# Implementation Checklist

## Setup

- [x] Create SDLC task folder + capture research/plan context.
- [x] Identify every module referencing `logo_url` (services, API route, email helpers, scripts).

## Core

- [x] Add `logo_url` compatibility utilities + shared restaurant select helper.
- [x] Update `server/restaurants/{create,update,list,details}` to retry without the column when `42703` is raised.
- [x] Guard `src/app/api/ops/restaurants/[id]`, `server/emails/bookings`, and `scripts/preview-booking-email` with the same fallback.

## Tests / Verification

- [ ] Run `pnpm run lint`.

## Notes

- Assumptions: remote Supabase migration will follow shortly; compatibility shim is temporary but must be safe to leave in place.
- Deviations: No UI QA needed because change is server-side only; coverage provided by lint + dev server sanity.

## Batched Questions (if any)

- None.
