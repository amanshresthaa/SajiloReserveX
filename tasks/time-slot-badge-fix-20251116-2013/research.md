---
task: time-slot-badge-fix
timestamp_utc: 2025-11-16T20:13:00Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: low
flags: []
related_tickets: []
---

# Research: Time slot badge accuracy

## Requirements

- Functional: Group badges in the time slot grid should reflect availability labels across all slots in a group, not just the first slot.
- Non-functional (a11y, perf, security, privacy, i18n): Preserve existing accessibility semantics and performance; no new data handling or localization impacts expected.

## Existing Patterns & Reuse

- Current `TimeSlotGrid` groups slots by label and renders badges based on `entries[0].availability.labels`, which can misrepresent mixed availability within the same group.

## External Resources

- None required.

## Constraints & Risks

- Small UI logic change; risk of altering badge visibility rules. Need to ensure badges only appear when appropriate and do not regress styling or a11y.

## Open Questions (owner, due)

- None identified.

## Recommended Direction (with rationale)

- Compute badges using the entire group (`entries.every(...)`) so group-level badges only render when all slots share the label. This aligns display with actual slot availability without introducing new UI elements.
