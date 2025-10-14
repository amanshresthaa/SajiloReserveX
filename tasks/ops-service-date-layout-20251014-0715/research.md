# Research: Ops Dashboard Service Date Layout

## Existing Patterns & Reuse

- `src/components/features/dashboard/OpsDashboardClient.tsx` currently renders the service date calendar inside a sidebar `<aside>`; the main column already uses responsive Tailwind grid utilities we can extend.
- `src/components/features/dashboard/HeatmapCalendar.tsx` encapsulates the copy, trigger button, and legend for the date selector; we can reuse it without modifying internal logic.
- `src/components/features/dashboard/SummaryMetrics.tsx` renders KPI cards in a responsive grid — useful for aligning the new block with existing spacing tokens.
- Shared UI primitives (`Card`, `Alert`, `Button`) come from the Shadcn-based `@/components/ui` set, so layout changes should prefer utility classes over custom components.

## External Resources

- None needed; layout adjustments rely on in-repo components and Tailwind utilities.

## Constraints & Risks

- Maintain mobile-first behavior: the service date block should still stack vertically on small screens to avoid cramped layouts.
- Moving the section must not break existing grid gaps or the order of screen reader focus.
- Ensure the calendar trigger remains accessible and retains the existing legend/heatmap context.

## Open Questions (and answers if resolved)

- Q: Should the heatmap calendar remain within a bordered card after moving?  
  A: Yes, requirement states “move this to the first block” implying the same card appears within the 2/3 column.
- Q: What does “make it horizontal” imply — entire block beside other content or internal layout?  
  A: Interpret as presenting the service-date card in the primary column with horizontal flex alignment on larger screens while keeping mobile stacking.

## Recommended Direction (with rationale)

- Relocate the service date `<section>` from the sidebar `<aside>` into the top of the main `<main>` column to satisfy positioning expectations.
- Wrap the service date card and KPI metrics inside a responsive grid that stacks on small screens but aligns horizontally (`md:grid-cols-2` or similar) so the block appears alongside KPIs on wider viewports.
- Adjust internal spacing utilities to preserve legend and calendar popover behavior while avoiding redundant borders.
- Update the task checklist/plan to track the layout change and ensure verification focuses on responsive breakpoints and keyboard accessibility.
