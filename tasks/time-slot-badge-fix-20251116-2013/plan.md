---
task: time-slot-badge-fix
timestamp_utc: 2025-11-16T20:13:00Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: low
flags: []
related_tickets: []
---

# Implementation Plan: Time slot badge accuracy

## Objective

Ensure time slot group badges correctly reflect availability labels by considering all slots in a group instead of only the first entry.

## Success Criteria

- [ ] Group badges display only when every slot in the group has the corresponding label.
- [ ] No regressions to slot selection behavior, accessibility, or layout.

## Architecture & Components

- `reserve/features/reservations/wizard/ui/steps/plan-step/components/TimeSlotGrid.tsx`: adjust badge computation logic for grouped slots.

## Data Flow & API Contracts

- No API changes. Availability labels remain sourced from existing `TimeSlotDescriptor.availability.labels` fields.

## UI/UX States

- Group headings with badges; badges appear only when labels align across all slots in the group.

## Edge Cases

- Mixed availability within a group should suppress group-level badge display.
- Empty slots array should continue to render nothing.

## Testing Strategy

- Manual reasoning/spot-check of badge rendering logic by simulating mixed label combinations in code review.

## Rollout

- No feature flag. Standard deploy.

## DB Change Plan (if applicable)

- Not applicable.
