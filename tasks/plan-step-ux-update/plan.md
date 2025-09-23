# Implementation Plan

## Objectives
- Update the booking flow so the default guest count matches the expected preset (interpreting the request as defaulting to 1 guest instead of the current 13).
- Adjust the sticky booking footer so step 1 only shows the primary action on the right while maintaining back/edit actions for later steps.
- Present the reservation summary details across two readable lines with adequate spacing, responsive across mobile, tablet, and desktop breakpoints, while adhering to the SajiloReserveX design principles (subtle haptics already triggered elsewhere, typographic hierarchy, micro-speed animations).

## Assumptions & Clarifications
- The phrase "input field default to be set 13" refers to the current default (13); the desired behavior is to default to 1 guest so UI presets and inputs align.
- The "details" to render on two lines refer to the sticky footer summary of party/time/date.

## Tasks
1. **Normalize default guest count**
   - Update `getInitialDetails` in `components/reserve/booking-flow/state.ts` to set `party` to `1`.
   - Ensure `PlanStep` continues to clamp the party input minimum to 1 and verify preset button states still work from the new default.

2. **Refine sticky footer actions layout**
   - Modify `StickyProgress` so the left circular button is hidden when there is only a single action provided (e.g., plan step) instead of duplicating the same action on both sides.
   - Preserve existing behavior for steps that provide two or more actions (back/confirm).
   - Maintain subtle haptic triggers and existing button variants.

3. **Rework summary layout for multi-line presentation**
   - Restructure the sticky footer summary content into two lines (e.g., top line emphasising party/time, bottom line for date and helpful context) with enhanced spacing/padding.
   - Ensure typography hierarchy: make the first line more prominent, second line secondary color/size.
   - Add responsive alignment tweaks so it reads well on mobile (centered) and scales gracefully on larger screens (e.g., align-start with max widths).
   - Confirm the summary continues to announce updates for assistive tech (aria/polite announcements) and respects design tokens.

4. **Verification**
   - Manually inspect code paths for regressions (no automated tests appear here) ensuring Typescript compiles.
   - Run `npm run lint` if time permits to ensure no lint regressions.

