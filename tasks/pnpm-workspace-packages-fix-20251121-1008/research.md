---
task: pnpm-workspace-packages-fix
timestamp_utc: 2025-11-21T10:08:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: low
flags: []
related_tickets: []
---

# Research: Fix pnpm workspace packages field

## Requirements

- Functional: add a `packages` field to `pnpm-workspace.yaml` so pnpm no longer errors about missing workspace package definitions.
- Non-functional (a11y, perf, security, privacy, i18n): keep the change minimal and non-disruptive; preserve existing patch configuration; no secrets introduced.

## Existing Patterns & Reuse

- Current `pnpm-workspace.yaml` only defines `patchedDependencies` and lacks `packages`.
- `pnpm-lock.yaml` lists a single importer `.` and `rg --files -g 'package.json'` finds only the root package, indicating a single-package workspace.

## External Resources

- pnpm workspace docs on required `packages` field (referenced conceptually; no external links pulled in this workspace).

## Constraints & Risks

- Adding overly broad globs could accidentally pull in unintended folders; keep the scope to the root package.
- Must retain existing `patchedDependencies` entries untouched.

## Open Questions (owner, due)

- Should future workspace globs include planned packages (e.g., apps/\*) if the repo structure evolves? (owner: maintainers, due: upon next workspace expansion)

## Recommended Direction (with rationale)

- Define `packages` to include the root package (`.`) alongside the existing `patchedDependencies` block, which satisfies pnpm’s requirement without pulling in non-package folders and aligns with the current single-importer setup.
