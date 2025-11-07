# Implementation Plan: Wizard Step Consolidation

## Objective

Create a deterministic JSON artifact (`context/wizard-steps-consolidated.json`) that bundles the production frontend source for the Booking Wizard steps (Plan, Details, Review, Confirmation) so cross-functional reviewers can ingest every step from a single file.

## Success Criteria

- [ ] JSON includes every targeted component/hook/type file with current contents and correct relative paths.
- [ ] File is valid JSON (passes `jq` parse) and stays under ~1 MB so it remains reviewable in git.
- [ ] Regeneration instructions are documented (task + `context/README.md`) for reproducibility.

## Architecture & Components

- Deterministic file list (array) defined inline in the generation command/script; sorted before serialization to stabilize key order.
- Node runtime (via `node -e` or script) reads each file as UTF-8, populates an object `{ [path]: source }`, stringifies with two-space indentation, and writes to `context/wizard-steps-consolidated.json`.
- No runtime bundler or transpilation required; we copy raw source verbatim.

## Data Flow & API Contracts

Process: file list → Node script reads contents → object keyed by path → JSON file on disk. No external APIs involved.

## UI/UX States

Not applicable (documentation artifact only).

## Edge Cases

- Missing/renamed file causes the script to throw; fail fast so we can update the list.
- Large files (Plan step form) could inflate output; confirm final size but expect <1 MB.
- Paths must stay relative (no absolute machine paths) to keep diff portable.

## Testing Strategy

- Run `jq 'keys' context/wizard-steps-consolidated.json` to ensure the JSON parses.
- Optionally re-read via Node to confirm structure (implicit by jq success).
- Spot-check a couple of keys to ensure contents look accurate.

## Rollout

- Single artifact commit; no feature flags.
- Mention file + regeneration steps in `context/README.md` for future maintainers.
