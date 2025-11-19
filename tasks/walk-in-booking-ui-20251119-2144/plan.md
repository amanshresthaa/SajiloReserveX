---
task: walk-in-booking-ui
timestamp_utc: 2025-11-19T21:44:00Z
owner: github:@assistant
reviewers: []
risk: medium
flags: []
related_tickets: []
---

# Implementation Plan: Walk-in booking UI

## Objective

We will enable restaurant staff to create walk-in bookings in the restaurant-facing flow while matching the guest-facing plan UX.

## Success Criteria

- [ ] Restaurant booking plan page uses guest-facing layout/components.
- [ ] Email/phone optional when restaurant creates booking; email notifications only send when email present.
- [ ] Bookings created by restaurant are labeled as walk-in/restaurant-created.

## Architecture & Components

- Rehydrate ops session + restaurant selection in `OpsWalkInBookingClient`; reuse guest shell elements (badge, gradient background, card wrapper) around `BookingFlowPage` with `mode="ops"` and `layoutElement="div"`.
- Booking wizard logic stays in `reserve/features/reservations/wizard` with `mode="ops"` for optional contacts.
- API: adjust `src/app/api/ops/bookings/route.ts` to tag bookings as walk-in/restaurant-created (`source` value + metadata) and gate email side-effects based on provided contact metadata.

## Data Flow & API Contracts

Endpoint: METHOD /api/...
Request: { ... }
Response: { ... }
Errors: { code, message }
Notes: Ops POST `/api/ops/bookings` should continue accepting optional `email`/`phone`; responses include booking payload used by wizard confirmation.

## UI/UX States

- Loading / Empty / Error / Success
  Notes: Keep existing loading/no-access states; ensure new layout preserves a11y landmarks and responsive behavior.

## Edge Cases

- No restaurant memberships / restaurant fetch error → keep existing fallback states in redesigned shell.
- Walk-in without email/phone should not enqueue emails; ensure schema tolerates empty email.
- Ensure source tagging does not break idempotency/recovery paths.

## Testing Strategy

- Unit / Integration / E2E / Accessibility
- Update/extend server tests for ops bookings route to cover provided-contact email gating and source label.
- Run/inspect relevant client tests if necessary; smoke the ops walk-in page manually.

## Rollout

- Feature flag: <flag_name> (namespace: feat.area.name)
- Exposure: 10% → 50% → 100%
- Monitoring: <dashboards/metrics>
- Kill-switch: <how to disable safely>
  Notes: No new flags planned; rely on regression monitoring. Can revert page/layout changes or adjust ops API if issues arise.

## DB Change Plan (if applicable)

- Target envs: staging → production (window: <time>)
- Backup reference: <snapshot/PITR link>
- Dry-run evidence: `artifacts/db-diff.txt`
- Backfill strategy: <chunk size, idempotency>
- Rollback plan: <steps/compensating migration>
