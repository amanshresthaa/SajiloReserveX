# Implementation Checklist

## Database

- [x] Create migration enabling RLS and policies for `table_holds` / `table_hold_members`.
- [x] Review migration for idempotency and policy correctness.

## Application

- [x] Verify no application code changes required (Supabase helpers already use service client).
- [x] Update task docs with verification plan & results.

## Tests

- [x] Run `pnpm test tests/server/capacity/manualConfirm.test.ts`.
- [x] Run `pnpm test tests/server/ops/manualAssignmentRoutes.test.ts`.
- [ ] Smoke test manual confirm via local API (service + authenticated clients).

## Notes

- Assumptions:
  - Service client retains bypass behaviour with explicit policy.
- Deviations:
  - Manual API smoke test pending valid auth context.

## Batched Questions (if any)

- None at this time.
