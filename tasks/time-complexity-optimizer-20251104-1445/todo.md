# Implementation Checklist

## Selector DFS

- [x] Add heuristic seed limiting (deficit + adjacency degree)
- [x] Record `seed_limit` diagnostics

## Lookahead

- [x] Cap plans considered (top 20)
- [x] Add time budget (15–100ms via selector limits)
- [x] Add capacity upper-bound precheck to skip planning
- [x] Extend lookahead diagnostics

## Legacy Conflicts

- [x] Move member filter into SQL join (`!inner` + `.in()`)

## Notes

- Conservative defaults; should not change scoring order in common cases.
- If nested filters unsupported in env, query still returns and app-side guards remain.
