# Research – Booking Flow Layout Redesign

## Scope & Current State
- **Hero section** currently rendered inside `components/reserve/booking-flow/index.tsx:423` with CTA buttons for starting or managing bookings.
- **Sidebar summary** for XL+ viewports lives in same file at `components/reserve/booking-flow/index.tsx:458`, providing sticky overview of date/time/party.
- **Plan step helper card** (`Next step` message) located in `components/reserve/steps/PlanStep.tsx:164` within the card header.
- **Sticky footer** defined in `components/reserve/booking-flow/sticky-progress.tsx`; existing structure relies on progress bar with gradient strip, step label, summary, and action buttons stacked vertically.
- **Preference checkboxes** within `components/reserve/steps/DetailsStep.tsx:89` derive from reducer state; default values originate in `components/reserve/booking-flow/state.ts:131` (`rememberDetails`, `agree`, `marketingOptIn` all `false`).

## Constraints & Considerations
- Removal requests apply across all breakpoints (mobile through wide desktop) with no replacement content implied unless necessary for UX.
- Sticky progress must be reimagined while preserving functionality: show current step, summary, and CTA actions passed via props; maintain micro-speed animation ethos and safe-area support.
- Checkboxes must appear checked by default while continuing to reflect state updates and validations (e.g., terms acceptance enabling “Review booking”).
- Need to ensure accessibility post-removal: verifying presence of page headings, semantics, keyboard focus order.
- Maintain existing analytics and action wiring (`Button` actions rely on state). No instructions to alter logic beyond layout/appearance defaults.

## Potential Risks / Unknowns
- Removing hero/sidebar reduces contextual guidance; may require subtle inline alternatives to avoid abrupt UX drop.
- Defaulting `agree` to true bypasses explicit consent; align with requirement but note potential legal considerations (flag in final notes).
- Sticky progress redesign must keep pointer accessibility and avoid regressing safe-area handling; ensure `aria` attributes reflect new structure.
- Ensure removal of helper card doesn’t disrupt layout spacing; adjust surrounding components to prevent awkward gaps.

## Verification Resources
- Code references extracted via `sed`/`rg` commands (see shell history).
- Lint command `pnpm lint` previously run; rerun after changes to validate.
- Plan to manually inspect diff for sticky progress logic and run TypeScript checks indirectly via lint output.

## New Observations (follow-up request)
- Sticky progress redesign now taller, causing underlying content to sit beneath overlay despite `pb-safe-b`. Need dynamic padding tied to actual sticky height to guarantee no occlusion.
- Requirement shift: replace bespoke `components/reserve/ui-primitives` with bona fide shadcn/ui components under `@/components/ui/*` to ensure consistency with design system instructions in AGENTS.md.
- Current alert dialog implementation is custom; opportunity to migrate to shadcn `AlertDialog` for accessibility/composability.
- No existing `components/ui` directory despite `components.json` referencing one—will scaffold full shadcn primitives (Button, Input, Card, Label, Checkbox, Textarea, AlertDialog) for reuse across booking flow.
- Need to audit all booking flow imports (Plan/Details/Review/Confirmation, sticky progress, helper form) to swap to new components and remove legacy file.
- Potential side effects: Terms checkbox defaulting to checked may have product/legal implications; highlight in notes.
- Tooling: plan to use ResizeObserver to measure sticky height and set main padding via inline style to eliminate overlap across viewport sizes.
