# Plan

1. Re-read the wizard UI files (`ReservationWizard`, `PlanStep`, `DetailsStep`, `ReviewStep`, `ConfirmationStep`, `StickyProgress`) to extract every imported UI/component dependency involved in the booking flow.
2. Group the findings by wizard step and note:
   - Component name and source (e.g., `@/components/ui/button`).
   - The interaction or data it handles (date selection, party size, etc.).
   - Any noteworthy accessibility/performance behaviour already implemented.
3. Verify the collected list against the reducer/hook layer to ensure no additional UI surfaces exist in the flow (e.g., sticky actions wiring), and capture anything relevant.
4. Prepare the final write-up for the user summarising components, locations, usage, and behaviours with precise file references.
