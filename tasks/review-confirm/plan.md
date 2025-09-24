# Plan: Review & Confirm

## Intent
Keep the review screen concise while ensuring submissions are reliable and accessible.

## Reuse
- Maintain the existing summary layout (definition list, sticky actions) and analytics hooks.
- Continue using `handleConfirm` in `booking-flow/index.tsx` to orchestrate the API call.

## Planned refinements
1. **Idempotent submissions** (future work): generate a client-side `requestId` per attempt so retries don't double-book.
2. **Accessibility**
   - Give the error banner `role="alert"` and move focus there when submission fails.
   - On success, send focus to the confirmation heading.
3. **Feedback**
   - Surface server messages inline and guide guests back to step 1 if their slot is no longer available.
   - Track `booking_submit_start` / `booking_submit_success` events to measure drop-off.

## Validation
- Manual QA: simulate network errors, confirm focus management and sticky actions behave correctly.
- Optional tests mocking `fetch` to exercise success + failure branches.
