# Research Notes

## Current PlanStep Behaviors
- `PlanStep` renders booking inputs inside `Card` with `CardHeader`, `CardContent`, etc. (components/reserve/steps/PlanStep.tsx).
- `partyOptions` is currently `[1..12]`, but initial state sets `party` to `13`, so the default rendered value in the custom input is 13 while preset buttons top out at 12 (components/reserve/steps/PlanStep.tsx, components/reserve/booking-flow/state.ts).
- The custom party `Input` forces `Math.max(1, party)` which means 13 remains unless user changes it (PlanStep.tsx).
- Step actions for PlanStep provide a single `Continue` action via `onActionsChange` (PlanStep.tsx), but the sticky footer duplicates it on both sides because the shared `StickyProgress` component maps the first action to the left circular button and the last action to the right (components/reserve/booking-flow/sticky-progress.tsx).

## Sticky Progress Summary Pattern
- `StickyProgress` builds the summary string as a single line joined with `•` separators (sticky-progress.tsx) and truncates overflow with `truncate`—likely the "details" the user wants split across two lines with better spacing.
- Layout currently centers summary text and assumes horizontal treatment on all breakpoints (sticky-progress.tsx).

## Design & Interaction Considerations
- Booking flow triggers `triggerSubtleHaptic` when step changes or sticky visibility toggles (components/reserve/booking-flow/index.tsx), aligning with the subtle haptics principle—changes should preserve this behavior.
- UI uses responsive max widths (`max-w-4xl`, `lg:max-w-5xl`) but summary region inside sticky footer lacks explicit responsive typography or spacing adjustments beyond default flex layout.
- Buttons rely on shared `Button` variants; left button uses `outline` variant by default.

## Constraints & Open Questions
- Requirement 1 ambiguously states "default guest size is 13, I want that 1, I meant the input field default to be set 13"—interpreting as wanting the default party size to become 1 (instead of the current 13) so both preset buttons and custom input align.
- Need to ensure any summary layout changes remain accessible across mobile, tablet, and desktop breakpoints.
- Removing left button must not break later steps that rely on back/edit actions; logic should target step 1 / single-action scenario only.

