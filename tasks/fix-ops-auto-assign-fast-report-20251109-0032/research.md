# Research: Fix Ultra-Fast Assignment Empty Report

## Requirements

- Functional: `runUltraFastAssignment` must always resolve with a `FastReport`, even when there are zero eligible bookings, so that `pnpm run build` (Next.js + tsc) succeeds.
- Non-functional (a11y, perf, security, privacy, i18n): No UI impact; maintain existing logging behavior and avoid unnecessary Supabase queries.

## Existing Patterns & Reuse

- The script already constructs a `FastReport` summary near the end of `scripts/ops-auto-assign-ultra-fast.ts` with all required fields populated.
- When there are bookings to process, the function builds `results`, `persistedStatuses`, and writes an optional JSON report—this workflow can be reused for the empty case with zeroed metrics.

## External Resources

- N/A – requirements derived from the in-repo TypeScript definitions and build failure output.

## Constraints & Risks

- Must not break downstream tooling that expects the JSON report structure (e.g., consumers reading `reports/*.json`).
- Avoid executing unnecessary Supabase queries when no bookings require work.

## Open Questions (owner, due)

- None identified; requirements are fully derived from the TypeScript compile error.

## Recommended Direction (with rationale)

- Detect the `toProcess.length === 0` branch and return a fully-populated `FastReport` object using the already-fetched metadata (`restaurant`, `config`, `allBookings`). This keeps the function signature consistent and avoids new side effects.
- Optionally refactor the zero-processed branch to skip persistence checks/report writing since there is no work to record.
