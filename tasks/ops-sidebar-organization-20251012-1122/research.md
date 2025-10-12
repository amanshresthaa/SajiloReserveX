# Research: Ops Sidebar Organization

## Initial Requirements

- Improve grouping and hierarchy of links in the `ops` sidebar
- Align styling and spacing with current design system (Shadcn-based)
- Preserve existing navigation functionality and routes

## Success Criteria

- Sidebar sections feel organized and scannable with clear grouping labels
- Active route highlighting remains accurate after any reordering
- Implementation adheres to existing component patterns and passes lint/build

## Existing Patterns

- `components/ops/AppSidebar.tsx` renders a single `SidebarGroup` labelled "Operations" that iterates through the flat `NAV_ITEMS` array and marks active entries via the `matcher` helper.
- Account and Support blocks already use additional `SidebarGroup` elements within the `SidebarFooter`, showing the pattern for stacking labelled sections.
- The layout wrapper (`components/ops/OpsAppShell.tsx`) uses the shared `SidebarProvider`, `SidebarInset`, and `SidebarRail` from `components/ui/sidebar`, so any structural change should continue to leverage those primitives.
- Icons are sourced from `lucide-react` and passed directly into `SidebarMenuButton` via the `asChild` pattern; hover/focus styles rely on the `group-hover/menu-button` utility classes defined in the shared sidebar styles.

## External Resources

- [shadcn/ui Sidebar documentation](https://ui.shadcn.com/docs/components/sidebar) — clarifies how to compose multiple groups and footers inside the Sidebar primitive.
- [lucide.dev icon reference](https://lucide.dev) — for selecting distinct, semantically appropriate icons when regrouping navigation links.

## Technical Constraints

- `OpsAppShell` feeds `account` data into `AppSidebar`; we must keep the sign-out button logic intact because it manages Supabase session state.
- Route-matching relies on string comparison helpers, so reordering or regrouping links must not break `matcher` logic; consider keeping helpers colocated with each nav item.
- Sidebar layout expects touch-friendly targets (`touch-manipulation` class) and must maintain `aria-current` for accessibility.
- The support link is an external `mailto:` anchor; moving it should not break the existing `SidebarFooter` semantics.

## Recommendations

- Split the flat `NAV_ITEMS` array into semantically grouped sections (e.g. "Daily operations" for dashboard/bookings-related items and "Restaurant management" for configuration/team tasks) to improve scanability.
- Introduce a `sections` structure so the JSX can iterate over `{ label, items }`, mirroring the footer grouping pattern and keeping the component declarative.
- Swap the duplicated `Settings2` icon on "Manage restaurant" for something more descriptive (e.g. `Store` or `Building2`) to reduce visual ambiguity between setup-oriented links.
- Ensure spacing and dividers align with design tokens (reuse `SidebarSeparator` if we need to delineate management vs. support areas) and verify focus order remains logical.

## Open Questions

- Should we introduce quick-action shortcuts (e.g. a primary button for walk-in booking) or keep parity with the current link-only approach?
- Do we need to expose role-based visibility (owner/manager) for any of the new sections, or will all items stay universally available?
