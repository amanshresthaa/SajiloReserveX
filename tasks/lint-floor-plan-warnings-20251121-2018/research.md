---
task: lint-floor-plan-warnings
timestamp_utc: 2025-11-21T20:18:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: low
flags: []
related_tickets: []
---

# Research: Floor plan lint warnings

## Requirements

- Clear lint warnings/errors in `src/app/app/(app)/seating/floor-plan/page.tsx` so pre-commit `eslint --max-warnings=0` passes.
- Keep component behavior unchanged.

## Existing Patterns & Reuse

- Uses React hooks (`useQuery`, `useMemo`, `useState`, `useEffect`) and lucide icons.
- Many imports unused; one `useEffect` missing dependency; one `useMemo` dependency warning; two unescaped quotes in JSX text.

## External Resources

- None required; rely on existing types and React lint guidelines.

## Constraints & Risks

- Must not alter functional behavior of floor plan view.
- Hook dependency fixes should avoid introducing unnecessary re-renders.

## Open Questions (owner, due)

- None currently.

## Recommended Direction (with rationale)

- Remove unused imports and variables.
- Add missing dependency to `useEffect` while keeping behavior stable.
- Move `tables` fallback logic inside `useMemo` to satisfy dependency warning without extra renders.
- Escape quotes in the JSX string literal to satisfy `react/no-unescaped-entities`.
