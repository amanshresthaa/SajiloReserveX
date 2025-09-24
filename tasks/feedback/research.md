# Research: Feedback & Post-Confirmation

## Existing behaviour
- `components/reserve/steps/ConfirmationStep.tsx` renders the final step. It:
  - Determines heading/description variants for confirmed, waitlisted, and manual-allocation states, with distinct iconography (CheckCircle, Clock, Info) and colored borders.
  - Announces the status via a `role="status"` container with `aria-live="polite"`, satisfying accessibility feedback requirements from `agents.md`.
  - Exposes sticky actions: close confirmation (navigates to `/thank-you`), add to calendar (generates `.ics` file), add to wallet (shares/copies summary), and start a new booking (dispatches `RESET_FORM`).
  - Displays a recap card (reference, guest, date/time, party, venue details, notes) and a venue contact card based on `DEFAULT_VENUE`.
  - Utilizes optimistic loaders (`calendarLoading`, `walletLoading`) to disable/animate the corresponding sticky buttons while tasks run.
- `components/reserve/booking-flow/index.tsx` resets sticky actions on step change and handles `onNewBooking` by dispatching `RESET_FORM`, which respects `rememberDetails` preference.
- `StickyProgress` adapts on the last step to highlight action buttons (calendar + wallet) in the center panel while still offering back/new booking controls.
- Haptics (`triggerSubtleHaptic`) fire when step changes or sticky bar appears, enhancing tactile feedback on supported devices.

## Error & edge cases
- Waitlist path: when the API returns `202`, reducer sets `waitlisted: true`, `allocationPending` flag, and `lastAction: "waitlist"`. ConfirmationStep shows waitlist copy and tip about inbox monitoring.
- Allocation pending (manual) path: `allocationPending` true, `waitlisted` false -> message indicates host team follow-up.
- There is no dedicated UI for outright failure in this step; errors bubble in ReviewStep’s card. If we want failure feedback here, we’ll need to introduce additional state or transitions.

## Verification steps
1. Read `ConfirmationStep.tsx` to confirm accessible announcements, action wiring, and state-dependent copy.
2. Cross-referenced reducer flags (`SET_CONFIRMATION` in `state.ts`) to understand how waitlist/allocation states propagate.
3. Confirmed navigation path (`router.push("/thank-you")`) and new booking reset logic.

## Risks & opportunities
- Calendar/Wallet actions rely on browser APIs (`Blob`, `navigator.share`, `navigator.clipboard`). Need graceful fallbacks for unsupported environments (already uses `alert` fallback, but we should ensure this meets "No dead ends" guidance).
- Venue data is static (`DEFAULT_VENUE`); multi-venue support would require dynamic data injection (context or fetch).
- There is no loading skeleton for this step; StepSkeleton fallback covers dynamic import but not post-submit delay. Consider skeletons for bookings with slow Supabase responses.
- Success state always navigates to `/thank-you` when closed; ensure that page exists and meets accessibility/performance requirements.
