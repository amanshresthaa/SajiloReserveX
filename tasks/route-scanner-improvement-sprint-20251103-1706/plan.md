# Implementation Plan: Route Scanner Improvement Sprint

## Objective

We will fix inaccurate route scanning by adding AST-based HTTP method detection, accurate guard detection with group overrides, and robust Mermaid ID generation so that route-map.json becomes the single source of truth and all docs derive from it.

## Success Criteria

- [ ] AST correctly detects all HTTP export patterns
- [ ] No default GET fallback; warnings emitted for unknowns
- [ ] Guard groups extracted in order with overrides applied
- [ ] `/ops/login` labeled public (no guards)
- [ ] Mermaid node IDs are unique; duplicates warned

## Architecture & Components

- `route-scanner.js`
  - `extractHttpMethods(filePath)`: parse via `@babel/parser` (typescript)
  - `extractRouteGroups(relativePath)`: ordered list of groups
  - `detectGuards(relativePath)`: apply guard rules with override
  - `generateMermaidDiagram()`: track IDs; warn duplicates

## Data Flow & API Contracts

- Input: file system under `src/app`
- Output: `route-map.json` with `meta.warnings`, `pages/api/other` entries include `groups` array
- Warnings schema: `{ type, route?, file?, message, groups? }`

## UI/UX States

- N/A (scanner CLI), but docs render must be correct (Mermaid).

## Edge Cases

- `export * from './handler'` → ambiguous; warn and return []
- Aliased export `export { GET as handler }` → count GET; warn aliasing
- Unknown group name `(beta)` → ignore guards; optionally warn `unknown_group`

## Testing Strategy

- Unit: method extraction patterns and re-exports; no exports; mixed exports
- Unit: guard detection across `(ops)/(public)`, `(authed)`, `(owner)`
- Unit: Mermaid ID duplicate detection with synthetic collisions

## Rollout

- Run scanner locally; compare counts
- Regenerate docs; verify Mermaid renders
- Add CI `--strict` later to fail on warnings
