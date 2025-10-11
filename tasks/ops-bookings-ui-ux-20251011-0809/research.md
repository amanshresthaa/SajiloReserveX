# Research: Ops Bookings UI/UX Improvements

## Initial Requirements

- Investigate Lighthouse report at `reports/lighthouse-after/ops-bookings-new-desktop.report.html` for UI/UX issues.
- Focus on improving accessibility, best practices, and performance scores relevant to user-visible experience.

## Success Criteria

- Document key issues from the report with actionable insights.
- Identify existing patterns or components in the codebase that can address the issues.
- Recommend approach that aligns with project UI/UX standards.

## Existing Patterns

- Global skip link is defined in `app/layout.tsx#L34` and styled in `app/globals.css#L318`; other layouts such as `app/(authed)/my-bookings/layout.tsx#L24` expose a `main` element with `id="main-content"` and `tabIndex={-1}` for focus management.
- Typography utilities favour semantic tokens (`text-muted-foreground`) tied to the HSL variables declared in `app/globals.css#L24`.
- Customer navigation consistently renders a branded home link via `components/customer/navigation/CustomerNavbar.tsx#L82`, using shadcn button/link patterns elsewhere in the header.

## External Resources

- [WCAG 2.1 contrast guidance](https://www.w3.org/TR/WCAG21/#contrast-minimum) – reference for achieving ≥4.5:1 ratio on body text.
- [Deque skip link pattern](https://dequeuniversity.com/rules/axe/4.10/skip-link) – clarifies requirement for focusable target with matching `id`.

## Technical Constraints

- `text-muted-foreground` currently resolves to `hsl(215 16% 47%)`, which yields ~4.49 contrast against the `bg-slate-50` background on the sign-in page, narrowly failing WCAG AA.
- Global skip link points to `#main-content`, but `app/signin/page.tsx#L21` renders `<main>` without that `id` or a `tabIndex`, so the skip target cannot receive focus.
- Brand link in `CustomerNavbar` declares `aria-label="Go to SajiloReserveX home"` while the visible label is “SRX SajiloReserveX”, triggering Lighthouse’s accessible-name mismatch audit.

## Recommendations

- Darken the `--muted-foreground` token (e.g. reduce lightness to ≤45%) so all `text-muted-foreground` occurrences meet AA contrast on light surfaces without bespoke overrides.
- Align the visible and accessible labels on the CustomerNavbar brand link by removing the redundant `aria-label` (screen readers will pick up the inline text).
- Follow the existing skip-target pattern by adding `id="main-content"` and `tabIndex={-1}` to the sign-in `<main>` element so both global and local skip links land correctly.
- Confirm no regressions on other pages that rely on `text-muted-foreground` after adjusting the token.

---

# Extended Research: Ops Surfaces Visual Pass

## Route Inventory & Existing Patterns

### `/ops` (Dashboard)

- Shell rendered via `components/ops/OpsAppShell.tsx` wrapping all Ops routes. Uses `SidebarProvider`, `SidebarInset`, and a sticky header with `SidebarTrigger` + CTA cluster.
- Primary hero card delivered by `components/ops/dashboard/TodayBookingsCard.tsx`; heavy reliance on `Card`, `Badge`, `ToggleGroup`, `Popover`, and `Calendar` shadcn components.
- Metric tiles are manually composed `div` blocks with `border border-border/60 bg-muted/10` styling—consistent across summary sections.
- Heatmap calendar uses custom `HEATMAP_CLASS_MAP` tokens for intensity; respects `muted` palette.

### `/ops/bookings`

- Page hydration drives `components/ops/bookings/OpsBookingsClient.tsx`. Layout is a simple `section` with `space-y-6`.
- Uses `BookingsTable` shared with dashboards; filter state managed via `useBookingsTableState`.
- Restaurant selector is a native `<select>` styled with border tokens but no adornments (no icon, minimal radius).
- Alert states use `border-dashed` pattern consistent with empty state on dashboard.

### `/ops/bookings/new`

- Client component `OpsWalkInBookingClient` renders a two-column header (title + back button) and optional restaurant selector before embedding `BookingFlowPage` (shared with guest booking flow).
- Booking form inherits mobile-first layout from reserve experience; wrapper uses `max-w-6xl`.

### `/ops/manage-restaurant`

- `ManageRestaurantShell` orchestrates three sections (operating hours, service periods, restaurant details). Each subsection uses `Card`, `Button`, `Input`, `Label` from the design system.
- The layout is a long scrolling column with minimal anchoring (no sticky local nav). Secondary actions (reset/apply) placed at bottoms of cards.
- Dirty-state detection triggers beforeunload warning; UI feedback relies on button disabled states and inline errors.

### `/ops/team`

- `TeamManagementClient` composes headline copy, restaurant switcher, permission alert, invite form, and invites table.
- This view still uses raw Tailwind slate tokens (`text-slate-900`, `text-slate-600`) instead of semantic design tokens, creating slight mismatch with rest of Ops UI.
- Select element styled with base border tokens but lacks shared `select` component from shadcn registry.

## Visual / UX Issues Observed

- **Header density on `/ops`**: Large horizontal padding and minimal right-side elements lead to empty space; CTA cluster feels detached from title.
- **Skip link styling**: Focus state uses dark fill that clashes with light background and overflows the viewport bounds—needs constrained width & inverted colors.
- **Metric hierarchy**: Summary counts in `TodayBookingsCard` render same weight as labels, reducing scannability; cards have ample padding but inconsistent icon alignment.
- **Spacing cadence**: Filter row (date dropdown + timezone chips) sits very close to heading; calendar popover button lacks breathing room.
- **Empty state callouts**: Dashed border cards blend into page background; could benefit from subtle tint or iconography.
- **Native selects**: Both bookings and walk-in selectors use plain `<select>`; inconsistent with shadcn `Select` component and lack caret icons.
- **Team view tokens**: Slate color tokens introduce contrast drift vs. the HSL-based design system; typography hierarchy differs from other routes.
- **Form section dividers (Manage restaurant)**: Long columns of inputs with minimal headings; need stronger section labels, grid alignment, and button grouping to reduce cognitive load.
- **Sidebar icon contrast**: Icons use low-opacity stroke against light rail; in screenshots they appear muted.
- **Button placements**: Secondary actions (back to dashboard, reset) occasionally float without consistent alignment; consider shared utility classes for toolbar layouts.

## External References

- [Radix Select](https://www.radix-ui.com/primitives/docs/components/select) patterns—useful for replacing native selectors while respecting keyboard support.
- [Figma Anatomy of Dashboard Cards](https://www.figma.com/community/file/1072298624675313338) for hierarchy cues (value prominence, label weight).

## Technical Constraints / Dependencies

- Ops shell is client-side; adjustments to `SidebarInset` should maintain compatibility with layout provider.
- `BookingFlowPage` is complex; styling must not regress guest-flow usage. Need to guard Ops-specific overrides via `mode="ops"`.
- `BookingsTable` shared across customer dashboards; global styling changes must be scoped to Ops variant to avoid regressions.
- Manage restaurant forms rely on React Hook Form? (No; local state). Styling adjustments must not interfere with validation state (error objects).

## Recommended Approach (Visual Pass)

1. **Ops Shell polish**
   - Tweak skip-link styles and ensure focus ring stays within viewport.
   - Rebalance header spacing (`px` adjustments, align CTA block).
   - Increase sidebar icon contrast via `text-muted-foreground` tokens.

2. **Dashboard card hierarchy**
   - Emphasize metric values (larger font size, bold) and soften labels.
   - Adjust `space-y` rhythm between heading, filters, and cards.
   - Refine heatmap legend/badges for color accessibility.

3. **Bookings / Walk-in selectors**
   - Replace native `<select>` with shadcn `Select` to align with design system.
   - Group filters within responsive flex container, ensure mobile stacking.

4. **Manage restaurant layout**
   - Introduce section headers with sticky quick-nav or cards grouped via accordion.
   - Improve form grid alignment (e.g., two-column layout on desktop) and consistent button bars.

5. **Team management tokens**
   - Swap hard-coded slate colors for semantic tokens (`text-foreground`, `text-muted-foreground`, `bg-muted`), align select styling.
   - Add informational empty state visuals matching Ops style.

## Open Questions

- Should heatmap intensity palette shift towards brand colors or remain green?
- Do we want a persistent sub-navigation for long forms (tabs/anchors) within manage restaurant?
- Any product requirement for exposing multi-restaurant switcher globally (header-level) vs. per page?
