---
task: fix-policy-version-duplicate
timestamp_utc: 2025-11-18T07:38:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: low
flags: []
related_tickets: []
---

# Implementation Plan: Fix duplicate `policyVersion` definition

## Objective

Resolve the duplicate `policyVersion` definition in `server/capacity/manual-session.ts` so Next.js/Turbopack build succeeds without altering intended capacity session logic.

## Success Criteria

- [ ] Build (`pnpm run build`) completes without errors.
- [ ] No behavior changes to manual session handling; `policyVersion` continues to reflect context/validation fallback.

## Architecture & Components

- File: `server/capacity/manual-session.ts`
  - Section computing post-hold context and updating session payload.
  - Ensure a single `policyVersion` variable is used with clear fallback order.

## Data Flow & API Contracts

- No API contract changes; manual confirm routes rely on `manual-session` helper.

## UI/UX States

- Not applicable (server-side fix).

## Edge Cases

- `postHoldContext.policyVersion` undefined; fallback to `holdResult.validation.policyVersion` should still work.
- `holdResult.validation` may not include `policyVersion`; fallback to `null`.

## Testing Strategy

- Run `pnpm run build` to confirm compilation passes.
- (Optional) Run targeted tests if available for capacity logic.

## Rollout

- No feature flags; immediate fix.
- No monitoring changes required.

## DB Change Plan

- Not applicable.
