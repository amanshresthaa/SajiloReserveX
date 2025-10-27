# Implementation Checklist

## Analysis

- [x] Document availability flow and key functions.
- [x] Call out high-risk failure modes leading to all-day table blocks.
- [ ] Validate hypotheses against live Supabase data (pending access).

## Implementation

- [x] Update `TableScheduleEntry` type to include dining/block intervals.
- [x] Hydrate both intervals in `loadAssignmentContext`.
- [x] Adjust availability checks (`tableWindowIsFree`, dependents) to compare new blocks vs existing dining windows.
- [ ] Run targeted TypeScript build/tests if available (pending commands from maintainer).

## Notes

- Assumptions: Access to service-role Supabase client for targeted dumps will be provided before coding fixes.
- Deviations: No code executed yet; work limited to repo analysis per AGENTS.md.
