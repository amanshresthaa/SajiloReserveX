# Implementation Checklist

## Setup

- [x] Create task folder & stubs
- [ ] Add @babel/parser to devDependencies
- [ ] Wire AST-based method extraction

## Core

- [ ] Remove default GET fallback; add warnings
- [ ] Extract group hierarchy and apply guard rules
- [ ] Add Mermaid node ID duplicate detection

## Tests

- [ ] Unit tests: method patterns
- [ ] Unit tests: re-exports and no exports
- [ ] Unit tests: guard overrides

## Notes

- Assumptions:
  - Re-export aliasing should still count method for visibility.
- Deviations:
  - `export *` treated as ambiguous with warning.
