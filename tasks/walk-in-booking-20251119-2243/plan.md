---
task: walk-in-booking
timestamp_utc: 2025-11-19T22:43:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Plan: Walk-in booking entry for restaurant ops

## Objective

Enable ops/restaurant staff to create walk-in reservations from the restaurant console using the existing booking wizard, with data tied to the active restaurant and a return path back to ops.

## Success Criteria

- [ ] Authenticated ops user can open a dedicated walk-in booking flow from the ops UI (CTA visible on bookings screen).
- [ ] Wizard defaults to the active restaurant (id & slug) and submits via ops booking endpoint; confirmation returns to ops context.
- [ ] Newly created booking appears in the ops bookings list after submission.
- [ ] Flow remains accessible (keyboard/focus) and responsive; no console/network errors in DevTools.

## Architecture & Components

- Page: new ops route under `src/app/app/(app)/bookings/new/page.tsx` (or similar) that mirrors auth redirect logic from `/app/bookings` and renders an ops-focused wizard client.
- Client wrapper: `OpsReservationWizardClient` (new) that:
  - Reads active restaurant from `useOpsSession`.
  - Fetches restaurant profile via `useOpsRestaurantDetails` to prefill slug/id/name/address/timezone/duration.
  - Renders `ReservationWizard` with `mode="ops"`, `initialDetails`, and `returnPath` back to `/bookings`.
  - Handles loading/empty states with minimal UI (spinner + text) and disabled wizard until data is ready.
- Entry point: add a CTA/button on `OpsBookingsClient` header to link to `/bookings/new` for creating a walk-in.

## Data Flow & API Contracts

- Wizard (ops mode) already posts to `/ops/bookings` via `useCreateOpsReservation`; requires `restaurantId`, `restaurantSlug`, booking details, contact info, marketing opt-in.
- Restaurant context: pull `restaurantId` + `restaurantSlug` from `OpsSession`; enrich with profile to supply name/address/timezone/duration (fallback to defaults if unavailable).
- Navigation: `returnPath` to `/bookings` so confirmation step routes back to ops list; close handler in wizard already respects `safeReturnPath`.

## UI/UX States

- Loading (profile fetch) → spinner/aria-live.
- Ready → wizard with Plan/Details/Review/Confirmation steps; ensure focus management still works.
- Error fetching profile → inline error with retry/back to bookings.
- Confirmation → success + option to create another booking or return to list.

## Edge Cases

- No active restaurant (no memberships) → block entry with friendly message/redirect back to dashboard.
- Missing slug/timezone in profile → fall back to defaults to avoid blank state.
- Offline mode: wizard already handles offline; ensure messaging remains accurate in ops context.
- Access: redirect unauthenticated users to `/login` with redirect back to `/bookings/new`.

## Testing Strategy

- Unit/logic: rely on existing wizard tests; lightly smoke new wrapper if feasible.
- Manual QA (Chrome DevTools MCP):
  - Navigate to `/app/bookings`, use CTA to open `/bookings/new`.
  - Complete walk-in booking (fill minimal details) and confirm; verify appears in bookings list.
  - Check keyboard navigation and focus through steps; screen reader labels intact.
  - Verify no console/network errors; offline banner still works when toggling offline.

## Rollout

- Ship without new flag (ops-only access). If desired, gate CTA with ops feature flag stub (can toggle via env later).
- Metrics: reuse existing wizard analytics (`context: 'ops'`).
- Kill-switch: hide CTA and route via feature flag or redirect if issues detected.

## DB Change Plan

- None (reuses existing `/ops/bookings` API).
