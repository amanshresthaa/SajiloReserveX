# Research: Reservation Status Badge Visibility

## Existing Patterns & Reuse

- `src/components/features/dashboard/BookingsList.tsx` renders a `BookingCard` that already surfaces an animated `BookingStatusBadge` showing the lifecycle state (`pending`, `checked_in`, `completed`, etc.).
- Conditional badges for `checkedInAt`/`checkedOutAt` use the generic `Badge` component from `@/components/ui/badge` to show secondary lifecycle chips.
- `src/components/features/dashboard/BookingDetailsDialog.tsx` repeats the same `Checked in`/`Checked out` badges within the modal header, so the guard needs to apply there too.

## External Resources

- None required; behaviour is contained within the dashboard feature code.

## Constraints & Risks

- Removing the chips entirely could hide useful context for in-progress visits; we only want to suppress the extra badges once a booking is fully completed.
- Need to avoid regressions for other statuses (pending, confirmed, checked_in) where the extra chips still help highlight state transitions.

## Open Questions (and answers if resolved)

- Q: Do we still need to show "Checked in/out" chips once the booking is marked completed?
  A: Product feedback (screenshot) indicates they add clutter after completion; completion is already conveyed by `BookingStatusBadge`.

## Recommended Direction (with rationale)

- Gate the secondary `Checked in`/`Checked out` badges behind a condition that excludes completed bookings (based on the effective lifecycle status) so the card looks cleaner post-completion while keeping current behaviour for active visits; apply the guard anywhere these supplemental chips appear (card list, modal header).
