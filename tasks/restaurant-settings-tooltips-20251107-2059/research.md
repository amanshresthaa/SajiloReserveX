# Research: Restaurant Settings Tooltips

## Requirements

- Functional:
  - Add descriptive tooltips on the `/ops/restaurant-settings` page so operators understand what each field/section controls without leaving the page.
  - Tooltips must cover profile fields (slug, timezone, reservation timings), weekly hours grid, overrides, and lunch/dinner service period editors.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Tooltips must be keyboard accessible (focusable triggers, proper aria relationships) and respect existing SHADCN tooltip patterns.
  - No regressions to existing forms or validation logic; tooltip rendering should be lightweight to avoid layout shifts.
  - Copy should be concise to maintain readability and future localization flexibility.

## Existing Patterns & Reuse

- `components/ui/tooltip.tsx` exposes Radix-based `Tooltip`, `TooltipTrigger`, `TooltipContent`, and `TooltipProvider`; already used in booking state machine UI.
- Restaurant settings UI lives in `src/components/features/restaurant-settings/*` with form controls sourced from shared `components/ui` inputs.
- No helper for label+tooltip combos exists; prior art wraps small icon buttons (via `lucide-react`) inside `TooltipProvider` for accessible hints.

## External Resources

- [Radix Tooltip docs](https://www.radix-ui.com/primitives/docs/components/tooltip) – ensures we respect focus/aria guidance already mirrored in our local component.

## Constraints & Risks

- Page renders server + client components; tooltips must only mount on client (ok because target components are already client components).
- Need to avoid interfering with form labels (Tooltips should supplement, not replace, visible helper text).
- Copy accuracy matters; unclear explanations could mislead operators. Need to validate assumptions about business rules (interval ranges, overrides, etc.).

## Open Questions (owner, due)

- Q: Should every field get a tooltip or only ambiguous ones? (owner: us)  
  A: Prioritize fields the user explicitly mentioned (“know what is what”)—focus on less obvious timings/hours/service period controls while keeping copy tight.

## Recommended Direction (with rationale)

- Instrument key headings/labels with an `Info` icon button (lucide) wrapped in `TooltipProvider`/`Tooltip`/`TooltipTrigger asChild` near the label text. Keeps semantics intact while offering opt-in help.
- Centralize tooltip text definitions per section to keep components readable and enable future reuse/testing.
- Cover:
  - Profile form: slug, timezone, reservation interval/duration/buffer, booking policy.
  - Operating hours: weekly schedule header, overrides header/fields.
  - Service periods: section header and each meal editor description.
- Verify via storybook? not available; instead run app + Chrome DevTools MCP for manual QA, ensuring keyboard focus can reveal tooltips.
