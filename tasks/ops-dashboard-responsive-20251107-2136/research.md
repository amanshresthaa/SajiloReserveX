# Research: Ops dashboard responsive cleanup

## Requirements

- Functional:
  - Keep all existing dashboard modules (service date picker, KPIs, reservations manager, VIP list, change feed) intact.
  - Preserve booking lifecycle interactions, exports, and table-assignment flows.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Mobile-first layout; single-column baseline that progressively enhances on larger breakpoints.
  - Maintain semantic landmarks/ARIA so assistive tech understands sections.
  - No new blocking network work; purely presentational adjustments.

## Existing Patterns & Reuse

- `src/components/features/dashboard/OpsDashboardClient.tsx` already wraps sections in Tailwind utility classes and follows a column flow; we can keep existing components and reorganize layout wrappers only.
- Buttons, cards, and banners reuse shared primitives (`Button`, `Card`, `BookingOfflineBanner`, `HeatmapCalendar`).
- Tailwind breakpoint utilities (`sm`, `lg`) are already available; we can extend them for responsive grids.

## External Resources

- [AGENTS.md](../../AGENTS.md) – enforces SDLC artifacts, mobile-first and accessibility requirements.

## Constraints & Risks

- Must avoid regressions in hook order or conditional rendering (React rules of hooks).
- Ops dashboard is critical for FOH operations; avoid shifting functionality or removing actions.
- Need to ensure reorganized layout does not introduce hydration mismatches between server and client.

## Open Questions (owner, due)

- None at this time; requirements inferred from user request and AGENTS.md.

## Recommended Direction (with rationale)

- Introduce a semantic `main` wrapper and reorganize sections into a responsive grid where the reservations module occupies the primary column and VIP/Change feed stack within a secondary column on large screens. This keeps mobile as a single column but better utilizes desktop width (“organized properly”).
- Normalize padding and spacing across sections, ensuring consistent `gap` tokens so the hierarchy is clearer on all devices.
- Keep logic untouched; changes remain scoped to layout classes and markup structure for minimal risk.
