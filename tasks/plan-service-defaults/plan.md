# Implementation Plan: Plan Step service defaults

1. Align shared helpers with new service windows
   - Update `bookingHelpers.serviceWindows` to encode the requested schedule: weekdays (Mon–Fri) with lunch 12:00–15:00, happy hour 15:00–17:00 (drinks only), dinner 17:00–close; weekends (Sat–Sun) with lunch 12:00–17:00 and dinner 17:00–close, no happy hour. Keep drinks available whenever the venue is open (12:00–23:00) but mark happy-hour-only periods via an extra flag returned alongside the windows.
   - Adjust `bookingHelpers.bookingTypeFromTime` to reference the new windows/flags so booking submission yields lunch or dinner by default except during weekday happy hour, mirroring the UI expectations.

2. Refine PlanStep availability calculations
   - Modify `getServiceAvailability` in `PlanStep.tsx` to reuse the helper window data (or at least the same time computations) and derive `enabled/disabled` states per booking option, enforcing drinks-only during weekday 15:00–17:00 and disabling lunch or dinner outside their respective windows.
   - Update the derived labels (`happyHour`, `drinksOnly`, `lunchWindow`, `dinnerWindow`, `kitchenClosed`) to match the new schedule so tooltips and badges remain accurate.

3. Synchronise slot metadata and defaults
   - Amend `getSlotLabel` to classify each slot according to the revised rules (lunch vs dinner vs happy hour vs drinks-only on weekdays) so the picker subtitle stays truthful.
   - Review `resolveDefaultService` to ensure it favours lunch/dinner except during weekday happy hour; adjust fallback ordering if necessary so initial time selection and manual slot changes set the correct default option.

4. Verify behaviour programmatically
   - Add a lightweight Node script (e.g., in-line via `node -e`) or temporary test harness that exercises key date/time combinations across weekdays and weekends, printing availability/default-service results to confirm lunch/dinner defaults and drinks-only windows behave per spec.
   - Document the verification outputs in the final response so the user can replicate.
