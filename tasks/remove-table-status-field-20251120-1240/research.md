---
task: remove-table-status-field
timestamp_utc: 2025-11-20T12:40:00Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: low
flags: []
related_tickets: []
---

# Research: Remove Status From Table Settings

## Requirements

- Functional: remove manual table status controls/visibility from the Table Inventory settings UI so it only handles CRUD metadata (number, capacity, zone, etc.). Avoid sending status changes on create/update from this screen.
- Non-functional: preserve existing backend status auto-refresh (allocations/maintenance), keep accessibility in forms, avoid breaking existing API consumers.

## Existing Patterns & Reuse

- TableInventoryClient currently renders a Status select and shows status badges in the grid (`src/components/features/tables/TableInventoryClient.tsx`).
- Table service types require `status`, and the API defaults status to `available` via zod (`src/services/ops/tables.ts`, `src/app/api/ops/tables/route.ts`).
- Status is recalculated automatically via `refresh_table_status` triggers in Supabase schema (`supabase/schema.sql:2474-2534`).

## External Resources

- None needed; behavior defined in repo.

## Constraints & Risks

- Removing the UI knob means operators cannot set `out_of_service` from this page; maintenance must be driven elsewhere.
- Must not accidentally overwrite live statuses on update (leave values unchanged or default only on creation where DB already default is `available`).

## Open Questions (owner, due)

- Should status still be visible for awareness? Assumed no per request; removing display entirely. (owner: github:@assistant, due: now)

## Recommended Direction (with rationale)

- Strip status inputs and badges from the TableInventoryClient to keep the settings page focused on static configuration.
- Make table create/update payloads omit status by default; rely on backend default/refresh to manage it. Keep status in read models for other surfaces if needed but unused here.
