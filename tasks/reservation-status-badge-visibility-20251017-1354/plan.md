# Implementation Plan: Reservation Status Badge Visibility

## Objective

We will enable operators to view completed bookings without redundant lifecycle chips so that the booking card remains readable once a visit is finished.

## Success Criteria

- [x] Completed bookings render only the primary `Completed` status badge (no secondary `Checked in/out` chips).
- [x] Active `checked_in` bookings only display the animated status badge (no duplicate secondary chip).
- [x] Completed bookings omit the secondary lifecycle chips in the booking details modal header too.

## Architecture & Components

- `src/components/features/dashboard/BookingsList.tsx`: adjust `BookingCard` conditional rendering so the `Checked in`/`Checked out` badges are hidden when the `effectiveStatus` resolves to `completed`.
- `src/components/features/dashboard/BookingDetailsDialog.tsx`: reuse the same guard so the modal header chips match the list presentation.

## Data Flow & API Contracts

- No API contract changes; we continue using the existing booking shape and status machine context.

## UI/UX States

- Loading: unchanged (skeleton/list placeholder already handled elsewhere).
- Empty: unaffected (cards not rendered).
- Error: unaffected (handled upstream).
- Success: Completed cards show only the `Completed` badge alongside table assignment and other meta chips; in-progress cards remain unchanged.

## Edge Cases

- Bookings whose `status` is `completed` but the state machine reports a transitioning `effectiveStatus` should still omit the extra chips once the `effectiveStatus` resolves.
- Ensure table assignment badge and other metadata chips remain visible regardless of lifecycle status.

## Testing Strategy

- Unit: Add a React Testing Library test covering that completed bookings suppress the secondary chips while checked-in bookings still show them.
- Integration: Not required for this UI-only conditional.
- E2E: Covered by existing flows; no additional coverage needed.
- Accessibility: Verify via manual QA that focus order and semantics remain intact.

## Rollout

- Feature flag: not required (small UI refinement).
- Exposure: instant once deployed.
- Monitoring: rely on existing dashboard usage analytics; no new telemetry needed.
