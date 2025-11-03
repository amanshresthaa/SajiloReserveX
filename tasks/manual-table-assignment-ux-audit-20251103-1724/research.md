# Research: Manual Table Assignment UX Audit

## Requirements

- Functional:
  - Staff manually select one or more tables for a booking from a floor plan or list
  - Run policy/capacity checks; prevent conflicting holds/allocations
  - Temporarily hold selected tables, then confirm to assign
  - Support unassigning, viewing holds/conflicts, and adjacency requirement
- Non-functional (a11y, perf, security, privacy, i18n):
  - A11y: keyboard-only operation, screen reader friendly states, ARIA on interactive elements
  - Perf: responsive interactions (<100ms UI response; <500ms validation start), avoid unnecessary network churn
  - Security/Privacy: no PII leaks in toasts/logs; auth-gated ops
  - i18n: user-facing copy concise/clear, time formats localized

## Existing Patterns & Reuse

- Booking details dialog with “Tables” tab provides the manual assignment UI
  - `src/components/features/dashboard/BookingDetailsDialog.tsx:936` (Manual assignment section)
  - Uses `TableFloorPlan` + `ManualAssignmentSummaryCard` + `ManualAssignmentValidationPanel` + `ManualAssignmentActions`
- Floor plan rendering and interaction
  - `src/components/features/dashboard/TableFloorPlan.tsx:256` (positioned table buttons)
  - Fallback list for unpositioned tables `src/components/features/dashboard/TableFloorPlan.tsx:320`
- Validation/Hold/Confirm flows via booking service
  - Auto hold on selection change (debounced 250ms): `src/components/features/dashboard/BookingDetailsDialog.tsx:411`
  - Validate selection (checks only): `src/components/features/dashboard/BookingDetailsDialog.tsx:560`
  - Confirm assignment with idempotency: `src/components/features/dashboard/BookingDetailsDialog.tsx:280`
  - Release hold: `src/components/features/dashboard/BookingDetailsDialog.tsx:588`
- Server routes
  - Manual context: `src/app/api/staff/manual/context/route.ts`
  - Validate: `src/app/api/staff/manual/validate/route.ts`
  - Hold: `src/app/api/staff/manual/hold/route.ts`
  - Confirm: `src/app/api/staff/manual/confirm/route.ts`
- Types and services
  - `src/services/ops/bookings.ts` (ManualSelection, Hold, Confirm, Context)
  - Realtime optional refresh via Supabase: `src/hooks/ops/useManualAssignmentContext.ts:24`

## Current State Flow Diagram (annotated)

```mermaid
flowchart LR
  A[Ops Dashboard – Booking Card] -->|Details| B[BookingDetailsDialog]
  B -->|Tabs: Tables| C[Manual Assignment]
  C --> D[Select tables on floor plan]
  D -->|250ms debounce| E{{Auto Hold created}}:::issue
  D --> F[Click 'Validate selection']
  F --> G[Run checks (no hold)]:::issue
  E --> H[Active hold visible]
  G -->|checks shown| H
  H --> I{Blocking errors?}
  I -- Yes --> J[Fix selection; re-validate]
  I -- No  --> K[Confirm assignment]
  K --> L[Assignments applied]

  classDef issue fill:#fff0f0,stroke:#e11d48,color:#7f1d1d
```

Annotations:

- E (Auto Hold) vs F/G (Validate): copy implies hold on validate, but code holds on selection; mismatch is confusing.
- At D/E, frequent selection changes may create repeated holds (churn).
- At D, “blocked” tables are clickable buttons without `disabled/aria-disabled`; failures are silent.

## Pain Points Analysis (evidence-linked)

1. Copy/Behavior mismatch: hold creation happens on selection, but UI states “Validating … will create a hold”
   - Auto hold: `src/components/features/dashboard/BookingDetailsDialog.tsx:411`
   - Copy: `src/components/features/dashboard/manual-assignment/ManualAssignmentSummaryCard.tsx:97` ("Validating a selection will create one automatically for three minutes.")
   - Severity: Critical — breaks user mental model; can cause unintended holds.

2. Disabled confirm tooltip isn’t accessible
   - Tooltip wraps a disabled `<Button>`; disabled elements don’t receive hover/focus → reason hidden
   - Code: `src/components/features/dashboard/manual-assignment/ManualAssignmentActions.tsx:41-64`
   - Severity: High — users can’t learn why confirm is disabled.

3. Blocked tables aren’t programmatically disabled and lack ARIA state
   - Positioned list uses onClick early-return, no `disabled`/`aria-disabled`
   - Code: `src/components/features/dashboard/TableFloorPlan.tsx:256-313`
   - Unpositioned list similar: `src/components/features/dashboard/TableFloorPlan.tsx:340-368`
   - Severity: High — keyboard/SR users think items are actionable; click fails silently.

4. Missing selection semantics for SR/keyboard
   - Selected tables lack `aria-pressed`/`role="checkbox"` or grid semantics
   - Code: same locations as above; no ARIA state toggles present
   - Severity: High — fails WCAG 4.1.2/2.1.1.

5. “Only show available” reduces clutter but may hide reasons
   - When filtered, reasons for unavailability (hold/conflict/inactive) vanish; no discoverability of why
   - Code: filter logic `src/components/features/dashboard/TableFloorPlan.tsx:221-246`
   - Severity: Medium — leads to confusion when tables “disappear”.

6. Validation vs Hold redundancy and network churn
   - Debounced (250ms) auto-hold + separate validate call = duplicate round trips during exploration
   - Code: debounce hold `:411`; validate `:560`
   - Severity: Medium — perf + rate limiting risk.

7. Reason for “blocked” not surfaced inline on unpositioned list
   - Buttons only have `title`, no explicit reason badges (e.g., “Held by X”, “Conflict: 19:00–20:00”)
   - Severity: Medium — scanning cost during peak.

8. Tooltip-only details rely on hover
   - Title/tooltip messages are not available on touch + disabled elements
   - Severity: Medium — mobile ops common; information loss.

9. Zone label lacks actual zone name in summary
   - Shows “Single zone (uuid)” not friendly name
   - Code: summary label format `ManualAssignmentSummaryCard.tsx:55-70`
   - Severity: Low — polish, reduces cognitive load.

10. Stale context handling requires manual refresh

- Alert provides “Refresh” button; could auto-refetch on hold expiry/realtime event
- Code: `BookingDetailsDialog.tsx:1012-1068`
- Severity: Low/Medium — avoidable friction.

## Interface Evaluation (visual hierarchy, IA, patterns)

- Pros
  - Clear two-pane layout: map left, summary/validation/actions right
  - Explicit adjacency toggle with label `aria-label` set
  - Validation panel communicates severity (ok/warn/error)
  - Holds surfaced with counts and countdown labels

- Cons
  - “Validate” vs auto-hold is semantically inconsistent (primary action meaning unclear)
  - Disabled reasons hidden due to tooltip-on-disabled pattern
  - Blocked/assigned/held states only partially conveyed visually; no inline text in buttons; reliance on color + title
  - No grid semantics; selection affordance not obvious for SR/keyboard

## Performance Issues

- Potential network churn from auto-holds during exploration (250ms debounce) → repeated POSTs
- Full-surface loading overlay for context fetch can block selection briefly (spinner overlay)
- Realtime optional; fallback polling every 10s (`useManualAssignmentContext.ts:19`) risks stale conflicts during peak

## Comparison Analysis (benchmarks)

- OpenTable Host, Resy OS, SevenRooms (industry patterns)
  - Common: explicit “Seat/Assign” flow; drag-to-select; strong blocked/occupied visual affordances
  - Often show inline badges (Held, Occupied, Conflict until 19:30), with color + icon + text
  - Disabled reasons remain discoverable via inline message or info popover, not only hover tooltips
  - Keyboard support varies, but top products increasingly support skip-to-list with filters; grid navigation less common but desirable
  - Holds are usually implicit during “assign” step or made explicit as “Seat Hold” with countdown; copy aligns with behavior

Why it matters: Aligning copy + behavior, surfacing reasons, and accessible toggles reduce decision time and error rates at the host stand during peak.

## Constraints & Risks

- Holds are concurrency control; removing auto-hold could reintroduce races → require careful server policy alignment
- Realtime dependency may not be universally enabled
- A11y fixes require careful CSS changes to maintain current visuals
- Touch targets on dense maps must remain ≥44px (current 64px is OK)

## Open Questions (owner, due)

- Q: Do we mandate explicit “Hold tables” action or keep auto-hold? (PM/Design)
  A: —
- Q: Are there SLA/rate limits on manual hold endpoints? (BE)
  A: —
- Q: Can we show zone names instead of IDs in summary? (BE/FE)
  A: —

## Recommended Direction (with rationale)

- Align copy and behavior: either (a) make hold explicit (“Hold selection”), or (b) keep auto-hold but update copy and throttle
- Fix accessibility: use `disabled/aria-disabled`, `aria-pressed`, descriptive labels, and keyboard grid navigation
- Improve reason transparency: inline badges for “Held by X”, “Conflict 19:00–20:00”, “Inactive” on both positioned and list views
- Reduce network churn: raise debounce, only auto-hold after stability window or after explicit Validate/Hold

## Assumptions, Challenges, and Verifications

- Assumption A: Auto-hold is triggered by selection (not validate)
  - Verified via code: debounced `holdMutation.mutate` on selection change `src/components/features/dashboard/BookingDetailsDialog.tsx:411`
  - Counterpoint: Summary card copy suggests hold on validate; validated by code that `validateMutation` does not create hold `:560`
- Assumption B: Disabled confirm tooltip isn’t accessible
  - Verified: Disabled buttons don’t accept focus/hover; Radix tooltip on disabled child likely won’t fire; code shows disabled button used as trigger `ManualAssignmentActions.tsx:41-64`
  - Alternative: Keep disabled, but add wrapper `span` focusable; widely recommended pattern
- Assumption C: Blocked tables are not programmatically disabled
  - Verified via code: early-return in onClick; no `disabled` prop and no `aria-disabled`
  - Alternative: visually muted + tooltip may suffice; however fails WCAG keyboard-only operability
- Assumption D: Network churn impactful
  - Evidence: 250ms debounce likely triggers multiple holds during exploration; could be mitigated server-side by de-dup or idempotency, but client should still throttle
  - Alternative: If server coalesces, churn is less severe, but client UX still unpredictable

Independent Cross-Checks

- Tests indicate structured validation plumbing works as expected: `tests/server/ops/manualAssignmentRoutes.test.ts`
- UI components wire to service methods aligning with routes in `src/services/ops/bookings.ts`
- Realtime optionality confirmed in `src/hooks/ops/useManualAssignmentContext.ts:19`

Residual Uncertainties

- Whether BE applies rate limiting/idempotency for manual-hold requests across rapid toggles
- Availability of zone display names in manual context (currently showing zoneId)

Final Reflection (fresh read-through)

Re-reading the flow and code with a clean slate: the core issue remains the copy/behavior mismatch—users are taught to validate to hold, but the system holds on selection; this cascades into hidden side-effects (churn, unexpected blocking), reduced transparency (reasons hidden behind tooltips/filters), and accessibility gaps (no programmatic disabled/pressed states). Aligning the mental model (explicit vs auto hold), surfacing reasons inline, and fixing ARIA will directly reduce confusion and speed up peak-hour assignments while improving compliance.
