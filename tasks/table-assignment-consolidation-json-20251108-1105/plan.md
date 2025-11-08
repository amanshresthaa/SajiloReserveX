# Implementation Plan: Table Assignment Consolidated JSON

## Objective

Produce an up-to-date JSON artifact, `context/table-assignment-code.json`, that captures the full source of the table-assignment engine modules for easy sharing.

## Success Criteria

- [ ] The JSON file contains every targeted module (`server/capacity/tables.ts` and all files under `server/capacity/table-assignment/`).
- [ ] Keys are sorted alphabetically to ensure deterministic diffs.
- [ ] JSON parses successfully (validated via `jq` or Node) and ends with a trailing newline for POSIX friendliness.

## Architecture & Components

- `context/table-assignment-code.json`: output artifact mapping `relative/path.ts` → source string.
- Generation script: short `node -e` command that reads the canonical file list, sorts it, builds an object, and writes the JSON using `JSON.stringify(data, null, 2)`.

## Data Flow & API Contracts

1. Input: local TypeScript sources listed in `context/README.md`.
2. Process: Node reads each file as UTF-8, stores contents as strings in an object keyed by path, sorts keys, serializes.
3. Output: JSON file stored in `context/table-assignment-code.json`.

## UI/UX States

- Not applicable (backend artifact generation only).

## Edge Cases

- Missing file read should surface as a Node error (fail fast instead of silently skipping).
- If new files are added later, they must be appended to the `files` array; for now we rely on the documented list which matches repo state.

## Testing Strategy

- Parse the generated JSON via `jq 'keys' context/table-assignment-code.json` to ensure structural validity.
- Optionally re-parse via Node if further confidence is needed (jq suffices for this task).

## Rollout

- No feature flag; once committed, downstream users can consume `context/table-assignment-code.json` directly.
- Note in task artifacts that regeneration occurred so future contributors know the snapshot date.
