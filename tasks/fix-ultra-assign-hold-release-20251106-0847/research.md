# Research: Ultra-fast auto-assign failures (holds vs assignments)

## Requirements

- Functional: Restore high success rate for `ops-auto-assign-ultra-fast` by avoiding cascading hold conflicts and `ASSIGNMENT_CONFLICT` errors when processing bookings concurrently.
- Non-functional (a11y, perf, security, privacy, i18n): Maintain current performance characteristics (15-way concurrency), avoid leaving persistent locks or data inconsistencies, handle errors deterministically without exposing sensitive details.

## Existing Patterns & Reuse

- `server/capacity/holds.releaseTableHold` handles cleanup of stray holds; `quoteTablesForBooking` already relies on it when conflicts occur pre-confirmation.
- `confirmHoldAssignment`/`AssignTablesRpcError` bubble up structured metadata we can use to classify failures in the script.
- The ultra-fast script already wraps each booking in `fastAssign` and reports results, so augmenting that function centralizes new logic.

## External Resources

- [Postgres exclusion constraints](https://www.postgresql.org/docs/current/ddl-constraints.html) – explain `no_overlapping_table_assignments` violations we observe.

## Constraints & Risks

- Current ops run with `holds.strict_conflicts.enabled=false`, so we cannot rely on DB pre-checks catching conflicts before holds persist.
- Releasing a hold after confirmation could break downstream flows, so cleanup must occur **only** when confirmation fails.
- Must avoid leaking unhandled promise rejections when releasing holds during error handling.

## Open Questions (owner, due)

- None – scope limited to script-level cleanup.

## Recommended Direction (with rationale)

- Track the hold returned by `quoteTablesForBooking` inside `fastAssign` and ensure we release it whenever confirmation or later steps fail **before** assignments persist. This prevents stale holds from blocking subsequent candidates.
- Improve failure diagnostics so we can distinguish `ASSIGNMENT_CONFLICT` from other errors, aiding observability for future tuning.
