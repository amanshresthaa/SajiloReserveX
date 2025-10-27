# Implementation Plan: Table Assignment UX

## Objective

We will give ops hosts a guided, accessible manual assignment workspace so they can confidently pick tables, understand validation blockers, and confirm holds without guesswork.

## Success Criteria

- [ ] Manual assignment section shows party size, capacity slack, zone, and hold countdown at all times.
- [ ] Validation checklist groups errors/warnings with actionable copy, and confirmation button stays disabled only when blocking errors exist or no hold is active.
- [ ] Layout remains usable on mobile (stacked) and desktop (two-column) while preserving keyboard navigation for table selection.

## Architecture & Components

- `ManualAssignmentSummaryCard` (new): renders party size, slack, zone, and hold metadata using Shadcn `Card`, includes adjacency toggle & countdown progress.
- `ManualAssignmentValidationPanel` (new): formats `ManualValidationResult.checks` into severity-badged list with hints and last validation timestamp.
- `ManualAssignmentActions` (new): houses Validate / Confirm / Clear CTAs, handles disabled tooltips and statuses.
- `ManualAssignmentTables` (wrapper around `TableFloorPlan`): arranges floor plan + unpositioned list with heading & loading overlay.
  State: Controlled by parent `BookingDetailsDialog`; components receive derived props to stay stateless.

## Data Flow & API Contracts

- Continue sourcing context via `useManualAssignmentContext(bookingId)`. Derive summary values locally when validation cache empty; otherwise trust backend-supplied `validation.summary`.
- `handleValidateSelection` ⇒ `bookingService.manualValidateSelection` (POST `/api/staff/manual/validate`).
- `holdMutation` debounce ⇒ `bookingService.manualHoldSelection` (POST `/api/staff/manual/hold`).
- `confirmMutation` ⇒ `bookingService.manualConfirmHold` (POST `/api/staff/manual/confirm`).
- No new endpoints required; ensure adjacency toggle and `requireAdjacency` flag thread through these calls.

## UI/UX States

- Loading: show skeleton overlay on floor plan; summary card shows spinners and disabled actions until context ready.
- Empty: display friendly message “Select tables to start” in summary + highlight available tables; fallback list for venues without coordinates.
- Error: render Shadcn `Alert` with retry + log details, allow re-fetch of context via existing refetch.
- Success: after confirm, show toast (existing) and refresh assignment list; summary resets to assigned view.

## Edge Cases

- Hold expiry mid-flow: detect via countdown reaching zero or context refresh; show warning banner and reset action state.
- Validation warnings only: allow confirm but surface callouts (e.g., “tables split across zones”).
- Manual context fetch failure: keep prior selection disabled; provide retry button that triggers `refetchManualContext`.
- No positional data: ensure unpositioned table list groups by zone/section and remains keyboard navigable.

## Testing Strategy

- Unit: add tests around new summary utility functions (e.g., slack formatter) if logic extracted; otherwise rely on TypeScript types.
- Integration: exercise manual assignment flow manually in dev via booking scenario; optional Vitest component test for validation panel formatting.
- E2E: not in scope today (Playwright coverage already focuses on Ops dashboard entry).
- Accessibility: keyboard walkthrough of table selection + buttons; run Axe (manual or DevTools) to ensure no new violations.

## Rollout

- Feature flag: none (ship default on).
- Exposure: full once merged; manual QA recorded in `verification.md`.
- Monitoring: watch ops dashboard error logs + manual feedback channel; no automated metrics change needed.
