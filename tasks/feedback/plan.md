# Plan: Feedback & Post-Confirmation

## Intent
Keep the confirmation step reassuring and actionable once the booking request is processed.

## Reuse
- Continue using the current `ConfirmationStep` layout (status banner, recap card, venue contact details, sticky actions).
- Preserve calendar and wallet export flows.

## Enhancements
1. **Feedback states**
   - Ensure confirmed, waitlist, and allocation-pending paths each show clear copy, icons, and aria-live announcements.
   - Consider adding an inline failure block if the submission ultimately errors after retries.
2. **Actions**
   - Maintain "Add to calendar", "Add to wallet", and "Start a new booking"; optionally add a "Modify booking" action that returns to review when allocation is pending.
3. **Focus & accessibility**
   - On mount, focus the status heading; keep sticky buttons keyboard reachable.
   - Continue honoring `prefers-reduced-motion` for any subtle animations.
4. **Context logging**
   - Record confirmation summary (reference, outcome, timestamp) in context files, redacting PII when necessary.

## Validation
- Manual QA across success, waitlist, and allocation-pending responses.
- Accessibility check with screen reader + keyboard.
- Optional component tests asserting the correct banners render for each outcome.
