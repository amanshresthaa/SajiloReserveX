# Implementation Plan: Policy + Context Snapshots (E3-S1)

## Objective

Add `policyVersion` and `contextVersion` across the manual assignment flow to detect drift and enforce consistency.

## Success Criteria

- [ ] `evaluateManualSelection` returns `policyVersion` and includes it in hold metadata.
- [ ] `getManualAssignmentContext` returns `contextVersion`.
- [ ] `validate/hold/confirm` require `contextVersion`; mismatches → `STALE_CONTEXT`; confirm compares policy → `POLICY_CHANGED`.

## Architecture & Components

- Utilities: `hashPolicy(policy)`, `computeContextVersion({holds, assignments, flags, window})`.
- `server/capacity/tables.ts`: plumb versions in evaluation, hold creation, and context.
- Routes: `src/app/api/staff/manual/*/route.ts` accept + validate versions.
- Services: `src/services/ops/bookings.ts` pass versions from UI.

## Data Flow & API Contracts

- Request bodies extended with `contextVersion` (and policy version in confirm, if required).
- Error codes: `STALE_CONTEXT`, `POLICY_CHANGED` include actionable fields.

## UI/UX States

- Show prompt to refresh context and revalidate when stale; explain policy drift.

## Edge Cases

- No holds/assignments → context hash includes empty arrays to remain stable.

## Testing Strategy

- Unit: hash stability and completeness.
- Integration: stale context rejection; policy drift across validate → confirm.

## Rollout

- Feature‑flag gating acceptable if needed.
