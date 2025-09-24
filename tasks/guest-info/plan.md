# Plan: Guest Information

## Intent
Keep the existing contact-details form frictionless while tightening accessibility and validation.

## Reuse
- Maintain the `DetailsStep` layout (Card, `Field`, inline errors) and sticky-action plumbing.
- Continue using `bookingHelpers.isEmail`/`isUKPhone` and analytics events for submissions.
- Preserve "remember my details" localStorage behaviour from `booking-flow/index.tsx`.

## Enhancements
1. **Validation polish**
   - Trim inputs and collapse extra whitespace before dispatching to state.
   - Add an `aria-live="polite"` summary near the top so screen readers hear validation issues.
   - Consider widening phone validation if international guests become a requirement.
2. **Existing booking detection (optional)**
   - Optionally call an API/MCP check once both email and phone are entered to warn about existing reservations.
   - Keep it advisory; do not block progression if the lookup fails.
3. **Focus management**
   - Focus the first invalid field on attempted submit when errors exist, otherwise focus the card heading on mount.
4. **Privacy & persistence**
   - Ensure copy clarifies the remember-me behaviour and allow easy opt-out.
   - If writing PII to context files, redact appropriately.

## Validation
- Manual QA: keyboard navigation, tab order, checkbox toggles, error states.
- Optional automated tests for trim logic and (if implemented) duplicate booking warnings.
