---
task: remove-table-status-field
timestamp_utc: 2025-11-20T12:40:00Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: low
flags: []
related_tickets: []
---

# Implementation Plan: Remove Status From Table Settings

## Objective

Make the Table Settings page purely for CRUD of static table attributes by removing manual status controls/visibility.

## Success Criteria

- [ ] Status select is removed from the table form; users cannot set status here.
- [ ] Status badge/column is removed from the table list.
- [ ] Create/update calls from this page no longer send status changes (default remains safe via backend).

## Architecture & Components

- `src/components/features/tables/TableInventoryClient.tsx`: adjust form state, inputs, and grid columns to drop status usage.
- `src/services/ops/tables.ts`: relax payload types and default create to available without requiring caller-provided status.

## Data Flow & API Contracts

- Creation: send metadata without status; service fills default (`available`) or relies on API default.
- Update: exclude status so we do not overwrite live statuses.

## UI/UX States

- Form still handles validation for required fields and active toggle; no status helper text.
- Table grid shows existing columns except status.

## Edge Cases

- Ensure table row skeleton/empty states use correct column counts after removal.
- Avoid sending `undefined` status values in payloads.

## Testing Strategy

- Manual sanity on Table Settings page: add/edit table and confirm payloads succeed without status.
- Visual check that column layout remains aligned after removal.

## Rollout

- No flags; straightforward UI adjustment.

## DB Change Plan (if applicable)

- None; backend defaults handle status.
