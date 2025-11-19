---
task: shadcn-base-migration
timestamp_utc: 2025-11-18T09:06:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: low
flags: []
related_tickets: []
---

# Research: Low-Risk Shadcn Base Migration

## Requirements

- Functional:
  - Refactor designated low-risk UI components to compose Shadcn primitives (`Alert`, `Badge`, `Tabs`/`ToggleGroup`, `Tooltip`, `Button`, `DropdownMenu`) without changing behavior.
  - Preserve existing component names, exports, and prop shapes; surface any unavoidable API changes explicitly.
  - Keep analytics hooks, navigation, and action handlers intact.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Maintain or improve accessibility semantics (roles, focus, aria); honor aria-live where present.
  - Keep styling stable via Shadcn variants; avoid CLS; ensure touch targets remain ≥ recommended sizes.
  - No secrets or config changes; UI-only refactor.

## Existing Patterns & Reuse

- Shadcn primitives already available in `@/components/ui` (e.g., `badge`, `button`, `alert`, `tooltip`); several targets partially use them (`BookingStatusBadge`, `HelpTooltip`, `DashboardErrorState`).
- Status indicators currently map status → bespoke classes; reusable mapping exists in `BOOKING_STATUS_CONFIG` for booking status badges and simple color maps in `StatusChip`.
- Offline banners already follow alert patterns (`BookingOfflineBanner`) but use mixed icon wrappers (`AlertIcon` from `@shared/ui/alert` in wizard flow).
- Mobile tabs (`CategoryTab`, `BottomTabs`) use custom button/link styling instead of Shadcn `Tabs`/`ToggleGroup`.
- Export buttons already use Shadcn `Button`; only visual/variant alignment likely needed.

## External Resources

- Shadcn docs for `Alert`, `Badge`, `Tabs`, `Tooltip`, `Button`, `DropdownMenu` for variant patterns and accessibility behaviors.

## Constraints & Risks

- Avoid visual regressions; new variants must match existing semantic colors and spacing.
- Some components (e.g., `Problem`, landing CTAs) currently rely on Tailwind/DaisyUI classes; need careful mapping to Shadcn while keeping layout intact.
- Offline banners handle queue state; refactor must not alter conditional rendering.

## Open Questions (owner, due)

- Q: Should mobile tabs use `Tabs` or `ToggleGroup` for better A11y parity?
  A: Default to `Tabs` with triggers if alignment is acceptable; otherwise use `ToggleGroup` while keeping roles.

## Recommended Direction (with rationale)

- Wrap existing structures with Shadcn primitives rather than rewriting logic; map existing style intents to Shadcn variants via `className` tweaks.
- Centralize status styling through Shadcn `Badge` variants; keep config lookups intact.
- Replace bespoke alert wrappers with `Alert`, `AlertTitle`, `AlertDescription` (and inline icons) to standardize spacing and semantics.
- For mobile tab-like controls, leverage `Tabs`/`TabsList`/`TabsTrigger` to match expected roles while preserving current labels/icons.
