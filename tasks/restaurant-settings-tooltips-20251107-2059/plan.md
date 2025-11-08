# Implementation Plan: Restaurant Settings Tooltips

## Objective

Help ops users understand every control on `/ops/restaurant-settings` by adding concise tooltips to ambiguous labels in the profile, operating hours, and service period sections.

## Success Criteria

- [ ] Each targeted label/heading shows an accessible tooltip explaining what the control does.
- [ ] Tooltips work via hover/focus/keyboard without disrupting existing form validation or layout.
- [ ] Manual QA (Chrome DevTools MCP) confirms tooltips render on desktop and mobile viewports without console errors.

## Architecture & Components

- `RestaurantDetailsForm` (components/ops/restaurants/RestaurantDetailsForm.tsx)
  - Import `TooltipProvider`, `Tooltip`, `TooltipTrigger`, `TooltipContent`, plus `Info` icon.
  - Introduce a lightweight `FieldHelp` inline component (within file) that renders the info icon + tooltip tied to a string. Reuse alongside specific `<Label>` elements.
- `OperatingHoursSection` (src/components/features/restaurant-settings/OperatingHoursSection.tsx)
  - Add tooltips to "Weekly Schedule" and "Overrides" headings, plus inline help text for override date/open/close fields.
  - Reuse same pattern (local helper) to keep markup tidy.
- `ServicePeriodsSection` (src/components/features/restaurant-settings/ServicePeriodsSection.tsx)
  - Add tooltip near the section description and each `MealEditor` label to clarify how lunch/dinner windows relate to kitchen hours and drinks occasions.

## Data Flow & API Contracts

- No backend changes. Tooltips are static strings hard-coded in components; no new data dependencies.

## UI/UX States

- Loading/error/empty states remain unchanged; tooltips only render when target components mount (already client components).
- Ensure tooltip triggers remain focusable even if parent button/input is disabled—use icon buttons or `span` wrappers with `tabIndex={0}` when necessary.

## Edge Cases

- Disabled controls (e.g., when `isDisabled` true) still need tooltip access; wrap non-interactive text in focusable spans where needed.
- Tooltip copy must not rely on dynamic data to avoid `undefined` text when queries fail.

## Testing Strategy

- Manual QA via Chrome DevTools MCP on `/ops/restaurant-settings` verifying:
  - Hover and keyboard focus reveal tooltips for each updated label.
  - Tooltips close when focus blurs and do not obstruct form submissions.
- Smoke check that form submission/validation still works (no console errors).

## Rollout

- No feature flag (copy-only change). Deploy with standard release; no metrics needed.
