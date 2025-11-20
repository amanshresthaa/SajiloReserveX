---
task: walk-in-bookings
timestamp_utc: 2025-11-19T23:28:00Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Plan: Walk-in Bookings Flow

## Objective

We will enable restaurant staff to capture walk-in bookings using the existing customer booking flow accessible via `/walk-in`.

## Success Criteria

- [ ] Staff can access a `/walk-in` entry point and complete a booking using the existing booking flow.
- [ ] Bookings created via walk-in have correct attribution for reporting/visibility.
- [ ] A11y and perf budgets remain within existing thresholds.

## Architecture & Components

- New ops page at `src/app/app/(app)/walk-in/page.tsx` (uses existing ops layout/auth) gating unauthenticated users to `/login?redirectedFrom=/walk-in`.
- Client wrapper `WalkInWizardClient` under `src/app/app/(app)/walk-in/_components/` to render `ReservationWizard` with `mode="ops"` and `returnPath="/bookings"`.
- Prefill wizard `initialDetails` from the active ops membership (`useOpsSession`) plus restaurant profile (`useOpsRestaurantDetails`) for name/slug/timezone/address/duration; show an inline warning if no membership is available.
- Add a discoverable entry point (button) on the ops bookings page header linking to `/walk-in`.
- Add a redirect in `next.config.js` so `/walk-in` resolves even if the canonical route sits under the ops segment (assumption until IA clarified).

## Data Flow & API Contracts

Endpoint: `POST /api/ops/bookings` (existing).
Request: `OpsWalkInBookingPayload` — `{ restaurantId, date, time, party, bookingType, seating, notes?, name, email?, phone?, marketingOptIn?, override? }`.
Response: `{ booking, bookings }` (normalized in wizard adapter).
Errors: Zod validation (400 with field errors), past booking errors, capacity windows; surfaced via wizard error messaging.

## UI/UX States

- Loading: show skeleton/loader while restaurant details resolve; fall back to defaults if unavailable.
- Empty/No membership: info alert with link back to `/bookings`.
- Wizard steps: Plan/Details/Review/Confirmation reused from customer flow; ops mode keeps contacts optional and close returns to `/bookings`.
- Error: inline wizard error state; fallback alert for missing restaurant context.
- Success: confirmation step then redirect/back to `/bookings` via close action.

## Edge Cases

- No active restaurant membership (should block with guidance).
- Missing restaurant profile fields (timezone/address) — fall back to defaults but log console warning.
- Offline mode handled by wizard; ensure not blocking submission states.
- API errors for past bookings/validation/limit; keep step-specific messaging.

## Testing Strategy

- Manual QA via Chrome DevTools MCP on `/walk-in` (auth + ops membership) across mobile/desktop; verify booking creation and return path.
- Smoke submission happy path (walk-in) and missing contact info.
- Optional: unit snapshot for new `WalkInWizardClient` guard logic; rely on existing wizard coverage otherwise.
- Check accessibility basics (focus, labels) in the new entry point CTA.

## Rollout

- Feature flag: none (route behind ops auth only); consider adding if requested.
- Exposure: full once deployed.
- Monitoring: rely on existing booking creation logs/alerts; inspect `/api/ops/bookings` metrics if available.
- Kill-switch: remove nav/CTA and redirect `/walk-in` to `/bookings` if issues arise.

## DB Change Plan (if applicable)

- Not anticipated; no schema changes planned.
