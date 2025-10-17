# Research: Booking Status Badge Infinite Loop

## Existing Patterns & Reuse

- `BookingStatusBadge` itself is a stateless presentational component that renders a Shadcn `Badge` with optional Radix `Tooltip`; there is no local state or effects.
- Booking state is coordinated through `BookingStateMachineProvider` (`src/contexts/booking-state-machine.tsx`) which exposes `registerBookings`, `beginTransition`, etc. Several dashboard surfaces consume it (`BookingsList`, `useBookingRealtime`).
- `registerBookings` currently dispatches a `REGISTER` action that clones entries regardless of whether anything changed; no structural sharing optimization is in place.
- `useBookingRealtime` polls bookings and calls `bookingStateMachine.registerBookings` inside an effect. Dependencies currently include the entire context value, so any context change retriggers the effect.

## External Resources

- React docs on `useReducer` state updates and avoiding unnecessary dispatch loops – to justify returning the existing state when no observable change occurs.

## Constraints & Risks

- Need to avoid breaking optimistic update handling—`applyRegister` must continue preserving `entry.optimistic` data.
- `registerBookings` is invoked from multiple places (initial bootstrap, realtime hook, potential future extensions), so changes must maintain behaviour for new bookings and status transitions.
- Tight coupling with `useBookingRealtime`: fixing reducer should not introduce stale state during actual remote updates.

## Open Questions (and answers if resolved)

- Q: Why does `BookingStatusBadge` appear in the stack if it has no state?
  A: Because the infinite re-render is triggered higher up; `BookingStatusBadge` is just part of the tree being re-rendered exhaustively.
- Q: What causes the infinite loop?
  A: The realtime hook dispatches `registerBookings`, which always mutates state even when nothing changed. That state update produces a new context object, retriggering the effect dependency, causing another dispatch—creating an endless loop.

## Recommended Direction (with rationale)

- Update the `REGISTER` reducer branch (`applyRegister`) to short-circuit when the incoming snapshots do not change any entry. By avoiding redundant state updates, we prevent the context value from changing and breaking the dependency cycle.
- Optionally tighten dependencies in `useBookingRealtime` after ensuring reducer optimisation, but initial fix should centre on returning the previous state to stop the loop at the source without altering hook signatures.
