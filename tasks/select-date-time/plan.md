# Plan: Select Date & Time

## Intent
Keep the booking flow lean by gathering schedule preferences in step 1 before moving directly to guest details.

## Key points
- Retain existing `PlanStep` UI (calendar/slots/party/notes) and analytics hooks.
- Ensure `handleContinue` routes to step 2 (`DetailsStep`) now that no venue step exists.
- Persist default venue metadata in state so later steps can reference `DEFAULT_VENUE` without additional input.
- Confirm sticky actions expose a single "Continue" CTA that remains disabled until date/time/party are chosen.

## Validation
- Manual pass: select date/time/party, advance to details, ensure summary + confirmation still reflect the default venue.
- Keyboard-only check for slot selection and calendar popover.
- Verify analytics (`select_date`, `select_time`, `select_party`) still fire.
