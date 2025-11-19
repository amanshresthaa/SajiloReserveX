---
task: shadcn-base-migration
timestamp_utc: 2025-11-18T09:06:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: low
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [x] Confirm Shadcn primitives imports for target components (`alert`, `badge`, `tabs`, `tooltip`, `button`, `dropdown-menu`).
- [x] Inventory current props and behaviors to preserve public APIs.

## Core

- [x] Refactor alert/banner components to use Shadcn `Alert` family with mapped variants.
- [x] Update badges/filters/tabs to compose `Badge`, `Tabs`/`ToggleGroup` with status → variant mapping.
- [x] Wrap tooltips with Shadcn `Tooltip` primitives and ensure triggers/content match.
- [x] Rebuild simple buttons/CTA/export actions atop Shadcn `Button`/`DropdownMenu` where applicable.
- [x] Align booking status badge styling to Shadcn badge classes (config-based).
- [x] Migrate `components/Modal.tsx` to Shadcn `Dialog` while keeping props and close behavior.
- [x] Replace landing demo buttons in `components/FeaturesGrid.tsx` with Shadcn `Button` variants while preserving layouts.
- [x] Rebase `components/Hero.tsx` CTA on Shadcn `Button`.
- [x] Migrate `components/ButtonPopover.tsx` to Shadcn `Popover` + `Button`.

## UI/UX

- [x] Preserve responsive layouts and spacing; align variants to existing visual tone.
- [x] Ensure loading/disabled states and aria-live/roles remain intact.
- [x] Maintain icon sizing and touch targets for mobile components.

## Tests

- [ ] Manual sanity check renders for each updated component.
- [ ] Accessibility spot check (focus, aria labels).
- [ ] Chrome DevTools MCP QA for affected UI surfaces (console/network, device emulation).

## Notes

- Assumptions: No new data dependencies; variants can cover existing styling with minor custom classes.
- Deviations: Record any unavoidable prop adjustments.

## Batched Questions

- None pending.
