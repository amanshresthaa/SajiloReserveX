# Research: Fix ESLint `any` Warnings

## Requirements

- Functional:
  - Clear the `@typescript-eslint/no-explicit-any` warnings that block the pre-commit hook by providing concrete types in the flagged modules.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Maintain current runtime behaviour in capacity/feature-flag code paths.
  - Preserve Supabase query safety; do not loosen type guards in a way that could hide malformed data.

## Existing Patterns & Reuse

- `server/table_assignment_consolidated.ts` already aliases the Supabase client as `SupabaseClient<Database, "public">`, avoiding the third `any` parameter—mirror this across capacity modules.
- `server/capacity/holds.ts` defines `ConfirmedAssignment` and uses `Tables<"table_hold_members">`; follow the same schema-derived types instead of custom shapes.
- `server/capacity/types.ts` exposes `BookingRecord` (and `BookingResult` relies on it), so we can type RPC payloads and guards with that model.

## External Resources

- None required; all typings live within the repo’s generated Supabase types.

## Constraints & Risks

- The Supabase RPC responses are returned as `unknown`; overly strict guards could drop legitimate rows, while overly loose casts reintroduce implicit `any`.
- Changes must stay backwards-compatible with existing call sites and telemetry logging.

## Open Questions (owner, due)

- Q: Do capacity RPCs always return a full `BookingRecord` payload? (Owner: self, due: during implementation) — Assumption is yes based on existing usage, but we will add a defensive validator to avoid regressions.

## Recommended Direction (with rationale)

- Replace the `DbClient` aliases with `SupabaseClient<Database, "public">` to carry typed schema information without `any`.
- Introduce narrow helper types/guards for Supabase join arrays (`table_hold_members`) and RPC result rows so we can map safely without `any` casts.
- Use the existing `BookingRecord` type with a runtime validation helper, enabling optional chaining in follow-up logic instead of `as any` access.
