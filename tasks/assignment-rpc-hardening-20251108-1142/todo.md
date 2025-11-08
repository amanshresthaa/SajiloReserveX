# Implementation Checklist

## Core Changes

- [x] Add `PolicyDriftError` + supporting types to `table-assignment/types.ts`.
- [x] Convert policy/adjacency snapshot mismatches and RPC `POLICY_CHANGED` errors into `PolicyDriftError` and update retry loop + notifications with `kind` metadata.
- [x] Remove duplicate `capacity.assignment.sync` enqueue in `assignTableToBooking`.
- [x] Add hold vs booking restaurant guardrail with structured observability.
- [x] Replace random assignment IDs with bounded re-fetch + warnings and allow empty IDs when data is still unavailable.
- [x] Expand schema cache/fallback heuristics to include Postgres codes `42883`/`42P01` and textual hints.
- [x] Add `.lt/.gt` filters to `legacyTableAvailabilityCheck` to bound scans.

## Verification

- [x] Run `pnpm lint` (per repo standard) to ensure TypeScript + eslint baselines remain clean.
- [ ] Add/extend automated tests covering assignment refresh + drift classification (tracked for follow-up).
