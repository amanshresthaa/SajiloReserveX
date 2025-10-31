# Implementation Checklist

## Setup

- [x] Confirm database connection details via Supabase env (MCP unavailable)
- [x] Document lifecycle, customer, and operating-hour requirements in `research.md`
- [ ] Coordinate staging snapshot + backup plan before executing migrations remotely

## Lifecycle Integrity (Workstream A)

- [x] Author remediation migration `20251103090100_remediate_booking_lifecycle.sql`
- [x] Author constraint validation migration `20251103090700_validate_booking_lifecycle_constraint.sql`
- [ ] Dry-run remediation + validation on staging snapshot
- [ ] Implement daily guardrail job (future follow-up)

## Global Customer Entity (Workstream B)

- [x] Create DDL migration `20251103090200_create_global_customer_schema.sql` (user_profiles + FK)
- [x] Update Supabase types with new RPCs/columns as needed
- [x] Author backfill migration `20251103090600_backfill_global_customer_data.sql`
- [ ] Prepare collision reports & manual review SOP prior to production run
- [ ] Plan enforcement migration `20251103090800_deprecate_customer_legacy_fields.sql` (kept dormant)

## Schema Documentation (Workstream C)

- [x] Add comment migration `20251103090300_add_schema_documentation.sql`
- [ ] Regenerate schema docs / reference site post-merge

## Table Assignment Procs (Workstream E)

- [x] Add wrapper migration `20251103090400_refactor_assignment_procedures.sql`
- [x] Update Supabase client types for `assign_single_table` and `assign_merged_tables`
- [ ] Update application call-sites to use new wrappers (follow-up with app squad)
- [ ] Schedule removal of legacy RPCs after adoption window

## Booking Operating Hours & Permissions (Workstream D)

- [x] Enhance `create_booking_with_capacity_check` + permission hardening (`20251103090500_enforce_booking_hours.sql`)
- [ ] Add negative/positive API tests for operating-hours enforcement
- [ ] Communicate permission changes to application owners before deploy

## Verification / Wrap-up

- [x] Re-run lifecycle audit query to ensure zero violations (pre-migration baseline)
- [ ] Capture staging execution logs + verification results in `verification.md`
- [ ] Prepare rollout & rollback runbook references (link to migrations + order)

## Notes

- Assumptions: No concurrent writes introduce new lifecycle inconsistencies between audit and validation; service_policy contains at most one active row.
- Deviations: Supabase MCP lacks access token; used direct `psql` with `SUPABASE_DB_URL` for audits.

## Batched Questions (if any)

- None currently.
