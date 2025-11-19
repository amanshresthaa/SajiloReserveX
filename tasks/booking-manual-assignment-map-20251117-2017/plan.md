---
task: booking-manual-assignment-map
timestamp_utc: 2025-11-17T20:17:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Plan: Consolidate Booking Manual Assignment Map

## Objective

We will enable maintainers to manage booking manual assignment mappings from a single JSON file for easier updates and consistency.

## Success Criteria

- [ ] All manual assignment mappings come from `/manual-assignment-map.json`.
- [ ] Existing features relying on manual assignment continue to work without regressions.

## Architecture & Components

- `manual-assignment-map.json` (root): sole JSON map describing manual booking assignment.
- Backend/API: `src/app/api/staff/manual/{validate,hold,confirm}/route.ts` plus `server/capacity/engine/public-api.ts` exports feeding those routes.
- Core logic/data access: `server/capacity/table-assignment/manual.ts` with supporting loaders in `server/capacity/table-assignment/supabase.ts`, adjacency/policy helpers, and `server/capacity/manual-session.ts` (state machine storage).
- Frontend consumers: `src/services/ops/bookings.ts`, `src/hooks/ops/useManualAssignmentContext.ts`, `src/components/features/dashboard/BookingDetailsDialog.tsx`.

## Data Flow & API Contracts

- Documentation-only; no API surface changes. Map will annotate existing routes/logic rather than redefining contracts.

## UI/UX States

- N/A (documentation-only change).

## Edge Cases

- Keep JSON concise and accurate so it does not drift from code; ensure role descriptions line up with latest engine exports.
- Avoid leaving `docs/manual-assignment-map.json` behind to prevent divergent sources.

## Testing Strategy

- Validate JSON structure with `jq`.
- Spot-check referenced file paths exist.

## Rollout

- No rollout/flagging required (doc-only move); ensure consumers know the new canonical path via repo root placement.

## DB Change Plan (if applicable)

- N/A (no DB changes expected)
