---
task: guest-wizard-nextjs-migration
timestamp_utc: 2025-11-16T23:21:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: high
flags: []
related_tickets: []
---

# Implementation Plan: Migrate guest booking wizard from Vite to Next.js

## Objective

Serve the customer booking wizard from the Next.js App Router (guest-facing) while preserving functionality, UX, and tests from the current Vite `reserve` app.

## Success Criteria

- [ ] Booking wizard routes available in Next.js with URL parity (or agreed mapping) and functional parity.
- [ ] Core flows (browse -> plan -> review -> confirm -> detail view) work with no regressions.
- [ ] A11y/perf baselines maintained; no critical/serious axe issues; bundle size controlled via code-splitting/client components.
- [ ] Tests updated and passing (unit/integration/Playwright for guest flows).

## Architecture & Components

- Next.js App Router pages under guest segment (e.g., `src/app/(guest-public)/(guest-experience)/reserve/...` or a new segment) to mirror Vite routes.
- Client-heavy wizard UI ported from `reserve/features/reservations/wizard/*` as client components.
- Shared UI/util modules extracted from `reserve/shared/*` into a shared folder or package for reuse.
- Data fetching via Next server routes/actions or client fetches to existing APIs; preserve analytics and storage logic.

## Data Flow & API Contracts

- Reuse existing booking APIs/hooks currently consumed in the Vite app; ensure endpoints and payload shapes remain the same.
- Hydrate client components with fetched data as needed (SSR optional; fallback to CSR with loading states).
- Maintain reservation detail fetch and history fetch for `/:reservationId` equivalent.

## UI/UX States

- Loading, empty/no slots, validation errors, offline banner, success/thank-you, reservation details/history.
- Auth/identity flow for guest sign-in/sign-up as currently implemented in guest Next.js routes.

## Edge Cases

- Offline/timeout handling (wizard offline banner).
- Draft persistence (local storage) parity.
- Slot unavailability mid-flow; conflict resolution.
- Invalid reservation IDs; not-found/error boundaries.

## Testing Strategy

- Unit: migrated hooks/utils/components from `reserve` using Vitest/RTL in Next context.
- Integration: component/page-level tests for wizard steps and reservation detail view.
- E2E: Playwright guest flows (browse → plan → review → confirm → detail), analytics events smoke.
- A11y: axe checks on key pages; keyboard-only flows.

## Rollout

- Feature flag (e.g., `feat.guest.wizard.next`) to gate Next.js wizard exposure.
- Gradual rollout: internal → small % → 100%; keep Vite app available during transition until confidence is high.
- Monitoring: existing analytics events; error reporting hooks.
- Kill-switch: flag off to revert to Vite or hide entry points.

## DB Change Plan (if applicable)

- None planned; reuse existing APIs.
