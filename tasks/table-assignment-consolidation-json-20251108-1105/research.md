# Research: Table Assignment Consolidation JSON

## Requirements

- Functional:
  - Produce a single JSON artifact that maps each table-assignment backend source file to its latest code so stakeholders can review the consolidated algorithm easily.
  - Store the artifact at `context/table-assignment-code.json` so it can be shared or consumed by downstream tooling.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Artifact must be valid JSON and prettified for readability.
  - Regeneration flow should be deterministic (stable key order) to avoid noisy diffs.
  - No secrets or environment-specific data can be embedded (only committed source code strings).

## Existing Patterns & Reuse

- `context/table-assignment-code.json` already exists as a snapshot of the allocator sources; regenerating it ensures the latest code is captured.
- `context/README.md` documents a Node one-liner that enumerates every relevant file (`server/capacity/table-assignment/*.ts` plus `server/capacity/tables.ts`) and writes the JSON.
- Similar consolidation tasks (e.g., wizard steps) reuse the same approach, confirming this is the accepted pattern.

## External Resources

- N/A – all data is local source code.

## Constraints & Risks

- Forgetting a file would yield an incomplete artifact, so we must source the file list from the documented command and keep it sorted.
- Malformed JSON would block downstream consumers; validate via `jq` or Node parse after generation.
- Artifact size is large, so we should avoid manual editing; always regenerate via script to prevent syntax errors.

## Open Questions (owner, due)

- None – requirement is clear.

## Recommended Direction (with rationale)

- Reuse the documented Node script from `context/README.md`, ensuring the `files` array matches the authoritative list so no table-assignment modules are missed.
- Sort the file list prior to serialization for deterministic ordering and stable diffs.
- After writing the JSON, parse it with `jq 'keys'` (or Node) to confirm validity, then record the verification in the task artifacts.
