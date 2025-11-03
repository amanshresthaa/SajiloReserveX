# Implementation Plan: Manual Table Assignment UX Improvements

## Objective

We will make manual table assignment clearer, faster, and accessible so hosts can confidently select, validate, and assign tables under peak load with fewer errors.

## Success Criteria

- [ ] Reduce average “selection → confirm assignment” time by 30%
- [ ] Increase first-try assignment success rate to ≥90%
- [ ] ≤1% of confirm attempts blocked due to undiscoverable reasons (measured via surfaced reason events)
- [ ] WCAG improvements: keyboard-only selection and SR labels verified
- [ ] ≤1 hold request per 3 seconds per booking (median) during exploration

## Architecture & Components

- `BookingDetailsDialog` (orchestrator)
  State: selection, requires adjacency, validation result, active hold
- `TableFloorPlan` (floor view)
  State: selected, blocked, assigned, held; add ARIA and optional grid semantics
- `ManualAssignmentSummaryCard` (summary)
  Show zone by name; clarify hold copy; show who/why for holds/conflicts
- `ManualAssignmentValidationPanel` (checks)
  Keep; clarify messages where needed
- `ManualAssignmentActions` (actions)
  Fix disabled tooltip; optionally split “Validate” and “Hold selection”

## Data Flow & API Contracts

- Keep `POST /api/staff/manual/validate` for checks only
- Decide on hold trigger:
  - Option A (Explicit hold): Add “Hold selection” button → `POST /api/staff/manual/hold` with TTL
  - Option B (Auto-hold, throttled): Debounce ≥700ms and only if selection stable for 700–1000ms; cap 1/5s
- Maintain `POST /api/staff/manual/confirm` and `DELETE /api/staff/manual/hold`

## UI/UX States

- Loading: partial skeleton on right panel; keep map interactive if context stale but not blocking
- Empty: clear messages if no coordinates; include why a table is blocked in list chips
- Error: inline alerts with retry; disabled reasons readable without hover
- Success: toast + immediate assignment list update

## Edge Cases

- Holds owned by other bookings; show “Held by <name> until HH:MM” badge
- Conflicts overlapping window; show “Conflict HH:MM–HH:MM” badge
- Mixed zone selection; indicate “Mixed zones” and surface check warning
- Past service (lock assignment)

## Testing Strategy

- Unit: tooltip wrapper behavior; a11y props on table buttons; copy changes
- Integration: selection → validate → (hold) → confirm; stale context path; unassign flow
- E2E: keyboard-only selection on floor plan and list fallback; mobile touch
- Accessibility: axe run; verify `aria-pressed`, `aria-disabled`, `aria-describedby`, focus order

## Rollout

- Feature flag: `manual_assign.explicit_hold` for Option A (explicit “Hold selection”)
- Exposure: 0% internal → 10% → 50% → 100%
- Monitoring: metrics below via client events + API counters
- Kill‑switch: disable explicit hold flag (fallback to current behavior) or disable auto-hold path

## Prioritized Issues (with fixes)

1. Critical: Copy/behavior mismatch (auto-hold vs validate)
   - Option A: change behavior (no auto-hold; “Hold selection” creates hold)
   - Option B: keep behavior, change copy to “Selecting tables places a 3‑minute hold; ‘Validate’ runs checks.”
2. High: Tooltip on disabled confirm
   - Wrap in `<span>` (focusable) with `aria-disabled` and use tooltip on wrapper; keep button non-disabled but `aria-disabled` or move reason inline text
3. High: Blocked buttons not `disabled/aria-disabled`
   - Add `disabled` and `aria-disabled` with reason; keep title as secondary
4. High: Selection ARIA
   - Use `aria-pressed` or `role="checkbox"` + `aria-checked`; optional grid semantics with arrow navigation
5. Medium: Inline reason badges
   - Add small badges “Held by X”, “Conflict 19:00–20:00”, “Inactive” on both map chips and list chips
6. Medium: Hold throttling
   - Increase debounce to 700–1000ms and add min interval; or tie hold only to explicit action

## Quick Wins vs Long‑Term

- Quick Wins (1–2 sprints)
  - Fix tooltip-on-disabled with wrapper + accessible reason
  - Add `disabled/aria-disabled` and `aria-pressed` (or checkbox) on table buttons
  - Update copy to align with hold behavior; show zone name instead of UUID
  - Inline badges for reasons on list chips; keep title as secondary
  - Raise hold debounce to 700–1000ms and cap frequency (if keeping auto-hold)

- Long‑Term (3–6 sprints)
  - Explicit “Hold selection” model behind flag; remove auto-hold or keep as fallback
  - Keyboard grid navigation for floor plan (arrow keys, Home/End); SR announcements on toggle
  - Adjacency visualization (connecting lines/groups) and smart suggestions
  - Realtime-by-default with graceful fallback; auto-refresh on context staleness/hold expiry
