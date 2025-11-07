# Implementation Plan: Consolidate Table Assignment Code

## Objective

We will provide a machine-consumable snapshot of the entire table-assignment engine by serializing every relevant TypeScript module into a single JSON artifact under `context/`.

## Success Criteria

- [ ] `context/table-assignment-code.json` lists every targeted file with exact, current source content.
- [ ] JSON validates (well-formed, UTF-8) and lint/type-check baselines remain unaffected (no TS files modified).

## Architecture & Components

- Source set: `server/capacity/tables.ts` and all `.ts` files within `server/capacity/table-assignment/`.
- Generation command: inline Node script (`node -e '...'`) that reads each file and writes `{ path: code }` mapping with sorted keys for determinism.
- Artifact location: `context/table-assignment-code.json` (new file committed to repo).

## Data Flow & API Contracts

- Inputs: current workspace files read via `fs.readFileSync(path, 'utf8')`.
- Processing: build a plain object keyed by relative paths (`server/...`) to full source strings; JSON stringify with indentation for readability.
- Output: JSON file consumed by downstream tooling (no runtime import inside app code, so no build impact).

## UI/UX States

- Not applicable; backend documentation artifact only.

## Edge Cases

- Ensure file list ordering is stable (sort list before serialization) so repeated generations are idempotent.
- File contents may include backticks/quotes; relying on `JSON.stringify` ensures safe escaping.
- Keep artifact size manageable by limiting scope to assignment modules (omit large unrelated directories).

## Testing Strategy

- Validate JSON structure via `jq type context/table-assignment-code.json` or re-parse in Node to ensure no syntax errors.
- Run `pnpm lint` opportunistically only if TypeScript files change (not expected here); otherwise confirm no code paths touched.

## Rollout

- Immediate; no feature flags.
- Document regeneration command (inside `todo.md`) so future updates follow the same process.
