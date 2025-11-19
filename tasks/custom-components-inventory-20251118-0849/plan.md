---
task: custom-components-inventory
timestamp_utc: 2025-11-18T08:49:56Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: low
flags: []
related_tickets: []
---

# Implementation Plan: Inventory Custom Components (Non-Shadcn)

## Objective

Produce an accurate list of UI components that are custom/vanilla (not from the Shadcn UI kit) to inform future refactors or standardization.

## Success Criteria

- [ ] Repo scan performed with coverage across major UI directories.
- [ ] Clear list of custom components with paths is produced.
- [ ] Assumptions about Shadcn vs custom scope are documented.

## Architecture & Components

- Analysis-only task; no code components created. Key areas to inspect:
  - `src/components/` (features, shared)
  - `src/app/` page-level components
  - Any `components/` or `ui/` directories outside Shadcn scaffold

## Data Flow & API Contracts

- N/A (read-only inventory).

## UI/UX States

- N/A.

## Edge Cases

- Shadcn-derived but renamed components: treat as custom unless clearly from registry.
- Components nested within feature folders (dialogs, forms, modals) should be included.

## Testing Strategy

- N/A beyond self-review of inventory coverage.

## Rollout

- Not applicable; deliver list via task folder/report.

## DB Change Plan (if applicable)

- Not applicable.
