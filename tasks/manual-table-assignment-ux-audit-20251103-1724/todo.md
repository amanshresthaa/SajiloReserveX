# Implementation Checklist

## Setup

- [ ] Finalize hold model (explicit vs auto-hold throttled) behind flag
- [ ] Align copy with chosen model; update `ManualAssignmentSummaryCard`

## Core

- [x] Add `disabled/aria-disabled` to blocked table buttons (map + list)
- [x] Add `aria-pressed` (or `role=checkbox` + `aria-checked`) to selected buttons
- [x] Provide inline badges for held/conflict/inactive states with succinct labels
- [x] Debounce hold requests (increased to 800ms)

## UI/UX

- [x] Replace tooltip-on-disabled with wrapper + accessible reason
- [ ] Keyboard navigation for floor plan (optional grid); ensure Space toggles selection
- [ ] Show zone names instead of UUID in summary (pending context changes)
- [x] Preserve “Only show available” state per user (localStorage)

## Tests

- [ ] Unit: action wrapper, a11y props, copy
- [ ] Integration: selection → (hold) → confirm, stale context, unassign
- [ ] E2E: keyboard-only path, mobile
- [ ] Axe/Accessibility checks

## Notes

- Assumptions: BE can provide zone display names; rate limit safe margins for hold endpoint
- Deviations: If explicit “Hold selection” proves too disruptive, keep auto-hold but throttle and update copy

## Batched Questions (if any)

- Which model do we prefer (explicit hold vs auto-hold)?
- Any BE constraints on hold frequency/TTL change?
