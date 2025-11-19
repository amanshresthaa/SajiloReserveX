---
task: fix-policy-version-duplicate
timestamp_utc: 2025-11-18T07:38:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: low
flags: []
related_tickets: []
---

# Research: Fix duplicate `policyVersion` definition in manual session

## Requirements

- Functional: Resolve Turbopack build error in `server/capacity/manual-session.ts` where `policyVersion` is defined multiple times; ensure build succeeds.
- Non-functional (a11y, perf, security, privacy, i18n): No UI changes; maintain existing behavior; avoid side effects.

## Existing Patterns & Reuse

- Reuse existing session/context computation functions in `server/capacity/manual-session.ts`.
- Follow existing error handling and object construction patterns in capacity code.

## External Resources

- None needed; issue is internal build typing/variable scope.

## Constraints & Risks

- Risk of altering business logic if variable removed incorrectly; need to preserve computed `policyVersion` semantics.
- Build must remain successful across referenced routes.

## Open Questions (owner, due)

- None identified; small scoped fix.

## Recommended Direction (with rationale)

- Inspect `policyVersion` assignments in `server/capacity/manual-session.ts` and remove duplicate/conflicting declarations by reusing existing variable or merging logic. Keep final `policyVersion` value consistent with intended behavior (prefer computed from `postHoldContext` fallback to validation result).
