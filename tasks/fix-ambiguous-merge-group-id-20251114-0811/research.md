---
task: fix-ambiguous-merge-group-id
timestamp_utc: 2025-11-14T08:11:00Z
owner: github:@assistant
reviewers: []
risk: high
flags: []
related_tickets: []
---

# Research: Fix Ambiguous merge_group_id in confirm_hold_assignment_tx

## Requirements

### Functional:

- The `confirm_hold_assignment_tx` RPC must successfully commit table assignments
- The RPC is called from `server/capacity/table-assignment/assignment.ts:861` during /reserve submission
- Must handle merge_group_id column references without ambiguity
- Support inline confirm attempts and auto-assign retry job

### Non‑functional:

- Security: Function is SECURITY DEFINER, must maintain proper access control
- Performance: No additional overhead from qualified column names
- Reliability: Must work consistently across all booking flows
- Remote-only: All migrations applied to Supabase remote environment per AGENTS.md

## Existing Patterns & Reuse

### Current Issue:

The function at `supabase/migrations/20251113203000_capacity_overlap_and_confirm_cache.sql:180` creates a temp table `tmp_confirm_assignments_tx` that has a `merge_group_id` column. Later in the function, there are unqualified references to `merge_group_id` that create ambiguity because `public.booking_table_assignments` also has this column.

### Affected Locations:

1. **Migration file**: `supabase/migrations/20251113203000_capacity_overlap_and_confirm_cache.sql`
   - Line ~274: `SELECT merge_group_id FROM tmp_confirm_assignments_tx LIMIT 1`
   - Line ~359: `tmp.merge_group_id` (already qualified in RETURN QUERY)
2. **Schema file**: `supabase/schema.sql:1597`
   - Contains duplicate of same function definition

### Error Impact:

- Postgres throws: "column reference "merge_group_id" is ambiguous"
- Transaction rolls back completely
- No rows written to `booking_table_assignments` or `allocations`
- Error propagates to all confirm attempts and retry jobs
- Results in "strict hold enforcement" mode instead of "assignment confirmed"

## External Resources

- [PostgreSQL Column Reference Ambiguity Docs](https://www.postgresql.org/docs/current/queries-table-expressions.html) — How Postgres resolves column names in JOINs and subqueries

## Constraints & Risks

### Constraints:

- Must maintain backward compatibility with existing calls
- Cannot change function signature or return type
- Must preserve all existing EXCEPTION handling
- Remote-only Supabase migrations (no local instance)

### Risks:

- **HIGH**: This is blocking all table assignments in production
- **MEDIUM**: Must redeploy to remote Supabase without testing locally
- **LOW**: Schema.sql duplication requires synchronization

## Open Questions

- Q: Are there other functions with similar ambiguity issues?
  A: Need to grep for other unqualified merge_group_id references in SQL functions

- Q: Should we add a test to catch ambiguous column references in CI?
  A: Yes, consider adding SQL linting in future task

## Recommended Direction (with rationale)

### Approach:

1. **Fully qualify all merge_group_id references** in the function body
   - Use `tmp.merge_group_id` when referencing temp table
   - Use `bta.merge_group_id` when referencing booking_table_assignments
   - Keep explicit table prefixes in SELECT, UPDATE, INSERT statements

2. **Update both migration file and schema.sql** to maintain consistency

3. **Deploy to remote Supabase** using Supabase MCP (staging → production)

4. **Verify fix** by re-running /reserve flow and checking logs for "assignment confirmed"

5. **Kill stale Next.js processes** (PIDs 81230, 56464) before restarting dev server

### Rationale:

- Minimal change with maximum safety
- No schema changes, only function body updates
- Explicit qualification improves readability and maintainability
- Follows PostgreSQL best practices for avoiding ambiguity
