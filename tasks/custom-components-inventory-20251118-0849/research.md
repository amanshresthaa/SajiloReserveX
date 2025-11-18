---
task: custom-components-inventory
timestamp_utc: 2025-11-18T08:49:56Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: low
flags: []
related_tickets: []
---

# Research: Inventory Custom Components (Non-Shadcn)

## Requirements

- Functional: Provide a complete list of UI components that are custom/vanilla (i.e., not sourced from the Shadcn UI kit) within the repo.
- Non-functional (a11y, perf, security, privacy, i18n): Read-only analysis; ensure terminology is clear; no code changes.

## Existing Patterns & Reuse

- Shadcn components live under `components/ui/` in many projects; custom components are typically in feature folders (e.g., `src/components/features/...`) and sometimes co-located near pages.
- No prior inventory doc found; will rely on directory structure and imports to identify non-Shadcn components.

## External Resources

- N/A (repo-internal analysis only).

## Constraints & Risks

- Risk of missing components if they resemble Shadcn patterns but are customized forks. Mitigation: treat anything outside canonical Shadcn registry paths as custom unless clearly a Shadcn scaffold.
- Large codebase could make manual listing incomplete; will prioritize directories housing UI components.

## Open Questions (owner, due)

- Q: Should Shadcn-derived but heavily modified components be counted as custom?
  A: Default to counting them as custom unless explicitly labeled as Shadcn.

## Recommended Direction (with rationale)

- Inventory component directories and summarize all non-Shadcn/vanilla components, noting their locations for easy follow-up refactors or migrations to Shadcn.
- Keep scope to UI components (TSX/JSX) and avoid non-UI utilities.
