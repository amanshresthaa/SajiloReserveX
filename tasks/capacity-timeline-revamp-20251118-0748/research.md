---
task: capacity-timeline-revamp
timestamp_utc: 2025-11-18T07:48:48Z
owner: github:@amankumarshrestha
reviewers: [github:@reviewer]
risk: medium
flags: []
related_tickets: []
---

# Research: Revamp capacity timeline view

## Requirements

- Functional:
  - Revamp the /ops/capacity timeline UI from scratch while keeping existing functionality (filtering, status display, interactions with segments/bookings/holds/out of service).
  - Ensure table/zone/service/date filters and search continue working.
  - Clicking segments should show appropriate details/actions; available slots should allow creating bookings entry point.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Maintain keyboard accessibility and focus indicators for timeline elements and dialogs.
  - Keep rendering performant for many tables/segments; avoid layout shift.
  - No secrets or PII in source; mock/demo data only.

## Existing Patterns & Reuse

- Current capacity page at `src/app/(ops)/ops/(app)/capacity/page.tsx` uses a timeline layout; will inspect and reuse data-fetching/state management patterns.
- UI kit: shadcn-based components already used in ops app; follow established styling and layout conventions from other ops pages.
- Modal/dialog interactions likely handled via existing dialog components; reuse the same component patterns.

## External Resources

- Reference code provided in user prompt (single-file mock timeline component) for layout/interaction ideas.

## Constraints & Risks

- Must keep functionality parity with existing capacity timeline (filters, current time indicator, selection behavior) while redesigning UI.
- Potential tight coupling with server data contracts; changes should avoid breaking API expectations.
- Need to confirm interactive behaviors (e.g., manual selection, booking creation) remain reachable after revamp.

## Open Questions (owner, due)

- How does the current capacity page fetch data (server components/hooks) and what props/state must remain? (owner: self, due: before implementation)
- What exact statuses/filters are required in production data? (owner: self, due: during design)

## Recommended Direction (with rationale)

- Review current capacity page implementation to understand data flow and controls.
- Redesign the timeline UI using the reference layout as inspiration, ensuring componentization and accessibility.
- Preserve existing data fetching/interaction contracts while improving visuals and usability.
