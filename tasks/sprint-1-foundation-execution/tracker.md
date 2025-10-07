# Sprint 1 Tracker — Foundation & Infrastructure

**Sprint window**: 13 Jan → 24 Jan 2025 (10 working days)  
**Velocity target**: 45–50 pts · **Definition of done**: Acceptance criteria satisfied, tests passing, CI green  
**Team tags**: FE1 · FE2 · BE · DES · QA · TL · PO

## Story Status Board

| Story ID | Title                         | Est. Pts | Owner(s) | Status      | Notes                         |
| -------- | ----------------------------- | -------- | -------- | ----------- | ----------------------------- |
| US-001   | Booking Discovery Flow        | 8        | FE1      | In Progress | Filters/analytics in progress |
| US-002   | Booking Wizard Steps 1–4      | 13       | FE1      | To Do       |                               |
| US-003   | Booking Confirmation Page     | 5        | FE1      | To Do       |                               |
| US-004   | Dashboard Bookings Table      | 8        | FE1      | To Do       |                               |
| US-005   | Profile Management            | 5        | FE1      | To Do       |                               |
| US-006   | Wizard QA & Offline Hardening | 5        | FE1      | To Do       |                               |
| US-007   | Auth Flow & Guards            | 5        | FE1      | To Do       |                               |
| US-008   | Blog Skeleton (Stretch)       | 3        | FE1      | To Do       |                               |
| US-009   | Analytics Wiring (Stretch)    | 3        | FE1      | To Do       |                               |
| US-010   | Demo & Docs                   | —        | FE1      | To Do       | Tracker, storybook, README    |

> Update status daily (To Do → In Progress → Review → Done). Add blockers/links as needed.

## Daily Standups

Each day (D1–D10), log:

- **Planned**: top priorities
- **Progress**: completed work with PR references
- **Risks/Blockers**: highlight dependencies + owner tags
- **Next Steps**: commitments for following day

### Day 1 — Mon 13 Jan

- Planned:
  - [ ] FE1: Set up sprint tracker, verify env, kick off US-001 research/tests
  - [ ] BE: Confirm `/api/restaurants` + `/api/bookings` readiness
  - [ ] DES: Provide Home hero/filters references
- Progress:
  - [x] FE1: Tracker + env validation complete; shared `useRestaurants` hook + hydrated `/` loader; RestaurantBrowser filters/analytics refactor with Vitest + extended Playwright mobile assertions (search + min-capacity + empty state); CI workflow wired for lint/typecheck/test/build/mobile smoke; TypeScript suite green (`pnpm typecheck`); wizard fixtures created with initial plan-step slot coverage; Plan-step UI/analytics tests added (calendar, party, occasion) and bookings API mock now emits pending/confirmed samples
  - [ ] BE:
  - [ ] QA:
- Risks / Blockers:
  - [ ] FE1: CI workflow still pending; `useRestaurants` hook + Playwright scenario outstanding
  - [ ] BE:
  - [ ] TL/PO:
- Next Steps / Carry-overs:
  - [ ] FE1: Stitch Plan→Review flow (wizard store + Review step analytics) and prep confirmation mutation/Playwright flow; monitor CI run after merge
  - [ ] QA:

### Day 2 — Tue 14 Jan

- Planned:
  - [ ] FE1:
  - [ ] BE:
  - [ ] QA:
- Progress:
  - [ ] FE1:
  - [ ] BE:
  - [ ] QA:
- Risks / Blockers:
  - [ ] FE1:
  - [ ] BE:
  - [ ] TL/PO:
- Next Steps:
  - [ ] FE1:
  - [ ] QA:

### Day 3 — Wed 15 Jan

- Planned:
  - [ ] FE1:
  - [ ] BE:
  - [ ] QA:
- Progress:
  - [ ] FE1:
  - [ ] BE:
  - [ ] QA:
- Risks / Blockers:
  - [ ] FE1:
  - [ ] BE:
  - [ ] TL/PO:
- Next Steps:
  - [ ] FE1:
  - [ ] QA:

### Day 4 — Thu 16 Jan

- Planned:
  - [ ] FE1:
  - [ ] BE:
  - [ ] QA:
- Progress:
  - [ ] FE1:
  - [ ] BE:
  - [ ] QA:
- Risks / Blockers:
  - [ ] FE1:
  - [ ] BE:
  - [ ] TL/PO:
- Next Steps:
  - [ ] FE1:
  - [ ] QA:

### Day 5 — Fri 17 Jan (Mid-sprint Check-in)

- Planned focus:
  - [ ] FE1: Dashboard cancellation flow
  - [ ] QA: Validate S1–S2 acceptance scenarios
- Mid-sprint summary:
  - Velocity achieved vs target:
  - Blockers escalated:
  - Scope adjustments:
- Actions:
  - [ ] TL:
  - [ ] PO:

### Day 6 — Mon 20 Jan

- Planned:
  - [ ] FE1:
  - [ ] QA:
  - [ ] DES:
- Progress:
  - [ ] FE1:
  - [ ] QA:
  - [ ] DES:
- Risks / Blockers:
  - [ ] FE1:
  - [ ] QA:
  - [ ] TL/PO:
- Next Steps:
  - [ ] FE1:
  - [ ] QA:

### Day 7 — Tue 21 Jan

- Planned:
  - [ ] FE1:
  - [ ] QA:
  - [ ] BE:
- Progress:
  - [ ] FE1:
  - [ ] QA:
  - [ ] BE:
- Risks / Blockers:
  - [ ] FE1:
  - [ ] QA:
  - [ ] TL/PO:
- Next Steps:
  - [ ] FE1:
  - [ ] QA:

### Day 8 — Wed 22 Jan

- Planned:
  - [ ] FE1: Auth guard + sign-in E2E
  - [ ] QA: Regression check wizard offline scenarios
- Progress:
  - [ ] FE1:
  - [ ] QA:
- Risks / Blockers:
  - [ ] FE1:
  - [ ] QA:
- Next Steps:
  - [ ] FE1:
  - [ ] TL/PO:

### Day 9 — Thu 23 Jan

- Planned:
  - [ ] FE1: Stretch goals (US-008/US-009)
  - [ ] QA: Regression sweep on booking/dashboard
- Progress:
  - [ ] FE1:
  - [ ] QA:
- Risks / Blockers:
  - [ ] FE1:
  - [ ] QA:
  - [ ] TL/PO:
- Next Steps:
  - [ ] FE1:
  - [ ] QA:

### Day 10 — Fri 24 Jan (Demo & Retro)

- Demo prep checklist:
  - [ ] Staging deployment live
  - [ ] Booking flow walkthrough rehearsed
  - [ ] Analytics dashboard screenshots
- Retro notes:
  - What went well:
  - What to improve:
  - Experiments for Sprint 2:

## QA & Metrics Log

- Coverage target ≥90% for core components — record actual here.
- Lighthouse scores (mobile): Home, Wizard, Dashboard.
- Accessibility audits (axe): capture date/result.

## Outstanding Issues

- [ ]
