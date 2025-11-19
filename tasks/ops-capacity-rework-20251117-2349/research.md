---
task: ops-capacity-rework
timestamp_utc: 2025-11-17T23:49:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Research: Ops Capacity Rework

## Requirements

- Functional:
  - Deliver accurate per-service capacity/timeline for ops users, including reservations and holds visibility.
  - New filters/actions TBD (e.g., service filter refinements, zone/date, status toggles).
- Non-functional (a11y, perf, security, privacy, i18n):
  - Keyboard-accessible filters and timeline interactions; visible focus.
  - Perf: faster load and refresh; avoid blocking UI.
  - Auth remains enforced; no secrets in client; respect locale/timezone inputs.

## Existing Patterns & Reuse

- Timeline fetch via `useOpsTableTimeline` and `/api/ops/tables/timeline` backed by `server/ops/table-timeline.ts`.
- Schedule/occasion data through `server/occasions/catalog.ts` (currently falling back on permission error).
- UI built with Shadcn components in `TableTimelineClient`.

## External Resources

- [Supabase / occasions catalog] — confirm permissions to `booking_occasions` for service-role.

## Constraints & Risks

- Current permission error on `booking_occasions` causes fallback catalog → potential incorrect service windows.
- Realtime gated by `NEXT_PUBLIC_FEATURE_REALTIME_FLOORPLAN`; otherwise polling.
- Must maintain accessibility and keyboard support.

## Open Questions (owner, due)

- Precise new filters/actions needed? (owner: @amankumarshrestha, due: asap)
- Target devices/browsers and performance budgets beyond default? (owner: @amankumarshrestha, due: asap)
- Should changes be gated behind a feature flag? (owner: @amankumarshrestha, due: asap)

## Recommended Direction (with rationale)

- Fix data correctness first (Supabase permissions, schedule/occasion alignment) to ensure accurate timelines.
- Tighten server timeline logic (service windows, holds/reservations overlays) and cache invalidation.
- Refine UI for clarity, filtering, and accessibility; keep Shadcn components; ensure keyboard support.
